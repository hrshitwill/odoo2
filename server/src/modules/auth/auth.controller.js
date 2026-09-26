const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateOtp = require('../../utils/generateOtp');
const sendEmail = require('../../utils/sendEmail');

// Helper to generate JWT Token
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'super_secret_jwt_key_stocksense_2026',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

// @desc    Register a new user (Restricted to INVENTORY_MANAGER)
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check system bootstrap: if users exist, enforce INVENTORY_MANAGER authorization
    const totalUsers = await User.countDocuments();
    if (totalUsers > 0) {
      if (!req.user || req.user.role !== 'INVENTORY_MANAGER') {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: Only authorized Inventory Managers can provision new operator accounts.',
        });
      }
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide operator full name, email, and security password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An operator account is already registered with this email address.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Normalize role
    let normalizedRole = 'WAREHOUSE_STAFF';
    if (role === 'INVENTORY_MANAGER' || role === 'inventory_manager') {
      normalizedRole = 'INVENTORY_MANAGER';
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: normalizedRole,
    });

    // If this was the first bootstrap registration, auto-login with token
    if (totalUsers === 0) {
      return sendTokenResponse(user, 201, res);
    }

    // Otherwise, return created operator details without changing caller's session
    res.status(201).json({
      success: true,
      message: `Operator ${user.name} (${user.role}) successfully provisioned.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user with email & password
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both registered email and security password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No registered operator found with this email.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password entered.',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Request Password Reset OTP by registered email
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your registered operator email.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered operator found with this email. Please contact an Inventory Manager for access.',
      });
    }

    const otp = generateOtp(6);
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    await user.save();

    // Prepare email content
    const subject = `StockSense Security: Password Reset Authorization Code [${otp}]`;
    const text = `Hello ${user.name},\n\nA password reset request was initiated for your StockSense operator account.\n\nYour 6-digit One-Time Authorization Code (OTP) is:\n${otp}\n\nThis code expires in 10 minutes. If you did not initiate this request, please alert your Inventory Manager immediately.`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: #1e293b; padding: 20px 24px; border-bottom: 1px solid #334155;">
          <h2 style="margin: 0; font-size: 18px; color: #f97316; font-weight: 700;">StockSense IMS Security</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Operator Authentication & Credential Recovery</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 14px; margin-top: 0;">Hello <strong>${user.name}</strong>,</p>
          <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5;">A password reset request was authorized for your operator account registered to <code>${user.email}</code>.</p>
          <div style="margin: 24px 0; padding: 18px; background: #020617; border: 1px solid #334155; border-radius: 8px; text-align: center;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; font-weight: 600;">One-Time Security Code (OTP)</span>
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #f97316; font-family: monospace; margin-top: 6px;">${otp}</div>
            <span style="display: block; font-size: 11px; color: #64748b; margin-top: 6px;">Valid for 10 minutes</span>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 0;">If you did not request this authorization code, please contact your central logistics supervisor immediately.</p>
        </div>
      </div>
    `;

    // Attempt dispatch via email service
    await sendEmail({ to: user.email, subject, text, html });

    // Respond with success (and debugOtp for dev testing if SMTP not active)
    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${user.email}.`,
      debugOtp: otp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and reset password
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, 6-digit OTP code, and your new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const user = await User.findOne({
      email: cleanEmail,
      resetPasswordOtp: cleanOtp,
      resetPasswordOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP security code. Please request a new code.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password successfully updated. You may now log in with your updated credentials.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    List all registered operators (Inventory Manager only)
// @route   GET /api/auth/users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete operator account (Inventory Manager only)
// @route   DELETE /api/auth/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    if (String(req.user.id) === String(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Security error: You cannot revoke your own active manager account.',
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Operator not found' });
    }

    res.status(200).json({
      success: true,
      message: `Operator account ${user.email} successfully revoked.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update operator details/role/password (Inventory Manager only)
// @route   PUT /api/auth/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const { name, role, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Operator not found' });
    }

    if (name) user.name = name.trim();
    if (role) {
      user.role =
        role === 'INVENTORY_MANAGER' || role === 'inventory_manager'
          ? 'INVENTORY_MANAGER'
          : 'WAREHOUSE_STAFF';
    }
    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Operator ${user.name} (${user.email}) updated successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

