'use client';

import React, { useState } from 'react';
import {
  Package,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  CircleCheck,
  AlertTriangle,
  Lock,
  Mail,
  UserCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/inventory';

export const AuthView: React.FC = () => {
  const {
    login,
    requestPasswordResetOtp,
    verifyOtpAndResetPassword,
    quickFillCredentials,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'forgot_request' | 'forgot_verify'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [simulatedOtpDisplay, setSimulatedOtpDisplay] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setStatusMessage(null);

    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      setStatusMessage({
        type: 'error',
        text: result.message || 'Invalid operator credentials. Access denied.',
      });
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setStatusMessage(null);

    const res = await requestPasswordResetOtp(email);
    setIsLoading(false);

    if (res.success) {
      if (res.debugOtp) {
        setSimulatedOtpDisplay(res.debugOtp);
      }
      setMode('forgot_verify');
      setStatusMessage({
        type: 'success',
        text: `6-digit authorization code dispatched to registered address ${email}. Check your email inbox.`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message || 'No registered operator found with this email. Please contact an Inventory Manager.',
      });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) return;

    if (newPassword.length < 6) {
      setStatusMessage({
        type: 'error',
        text: 'New password must be at least 6 characters long.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    const res = await verifyOtpAndResetPassword(email, otp, newPassword);
    setIsLoading(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: 'Password successfully updated. You may now authenticate with your updated password.',
      });
      setMode('login');
      setPassword(newPassword);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message || 'Invalid or expired OTP code. Please request a new code.',
      });
    }
  };

  const handleQuickFill = (role: UserRole) => {
    const creds = quickFillCredentials(role);
    setEmail(creds.email);
    setPassword(creds.pass);
    setStatusMessage({
      type: 'info',
      text: `Loaded credentials for ${role === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff'}. Click Authenticate Session.`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 bg-technical-grid select-none">
      {/* Container */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Industrial Banner */}
        <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-xs">
              <Package className="w-5 h-5 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight font-display">StockSense</span>
                <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  IMS v2.6
                </span>
              </div>
              <p className="text-[10px] font-sans uppercase tracking-wider text-slate-400 font-medium">
                Industrial Operations Platform
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
            ONLINE
          </span>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-sans flex items-start gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CircleCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.75} />
              ) : statusMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={1.75} />
              ) : (
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" strokeWidth={1.75} />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Mode 1: Login */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                  Registered Operator Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@stocksense.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600">
                    Security Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusMessage(null);
                      setMode('forgot_request');
                    }}
                    className="text-[11px] font-sans text-orange-600 hover:underline cursor-pointer font-medium"
                  >
                    Forgot Password? Reset via OTP
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-sans font-medium tracking-wide flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate Session'}</span>
                <ArrowRight className="w-4 h-4 text-orange-400" strokeWidth={1.75} />
              </button>

              {/* Manager-Only User Provisioning Notice */}
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-600 shrink-0" strokeWidth={2} />
                  <span>Access Provisioning Policy</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Public registration is disabled. Only authorized <strong>Inventory Managers</strong> can provision new operator accounts to access warehouse operations.
                </p>
              </div>
            </form>
          )}

          {/* Mode 2: Forgot Password (Request OTP via Registered Email) */}
          {mode === 'forgot_request' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="text-xs text-slate-600 font-sans leading-relaxed">
                Enter your <strong>registered operator email</strong>. If the email exists in the system directory, a 6-digit one-time authorization code (OTP) will be dispatched to your inbox.
              </div>

              <div>
                <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@stocksense.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg text-xs font-sans font-medium cursor-pointer transition-colors shadow-xs"
              >
                {isLoading ? 'Verifying Email & Dispatching Code...' : 'Dispatch Reset OTP to Registered Email'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStatusMessage(null);
                    setMode('login');
                  }}
                  className="text-xs font-sans text-slate-500 hover:underline cursor-pointer"
                >
                  ← Return to Login Screen
                </button>
              </div>
            </form>
          )}

          {/* Mode 3: Verify OTP & Reset Password */}
          {mode === 'forgot_verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-xs text-slate-600 font-sans leading-relaxed">
                Enter the 6-digit security code dispatched to <strong>{email}</strong> and specify your new password.
              </div>

              {/* Dev Simulation Badge (if running locally or SMTP simulated) */}
              {simulatedOtpDisplay && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-sans">
                  <div className="text-amber-800 uppercase text-[10px] font-semibold tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Dispatched OTP Code (Local Dev / Offline Mode):</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-orange-600 tracking-widest mt-1">
                    {simulatedOtpDisplay}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-1">
                    Valid for 10 minutes. Click the code to autofill:
                    <button
                      type="button"
                      onClick={() => setOtp(simulatedOtpDisplay)}
                      className="ml-1.5 font-bold underline text-amber-900 hover:text-black cursor-pointer"
                    >
                      Autofill OTP
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                  6-Digit OTP Security Code *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 079485"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                  New Security Password * (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-sans font-medium cursor-pointer transition-colors shadow-xs"
              >
                {isLoading ? 'Verifying Code & Updating Password...' : 'Verify OTP & Save New Password'}
              </button>

              <div className="flex justify-between items-center pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMode('forgot_request')}
                  className="text-orange-600 hover:underline cursor-pointer"
                >
                  Resend OTP Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusMessage(null);
                    setMode('login');
                  }}
                  className="text-slate-500 hover:underline cursor-pointer"
                >
                  Return to Login
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Credentials Strip for Evaluation / Testing */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-sans uppercase tracking-wider text-slate-400 font-semibold text-center">
              Quick-Fill Test Accounts (Database Seeded)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('inventory_manager')}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs font-sans transition-colors cursor-pointer"
              >
                <div className="font-semibold text-slate-900 flex items-center gap-1">
                  <span>Manager</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-orange-100 text-orange-700 font-mono">Full</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">manager@stocksense.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('warehouse_staff')}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs font-sans transition-colors cursor-pointer"
              >
                <div className="font-semibold text-slate-900 flex items-center gap-1">
                  <span>Staff</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 text-blue-700 font-mono">Floor</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">staff@stocksense.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
