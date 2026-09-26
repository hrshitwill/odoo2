const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['INVENTORY_MANAGER', 'WAREHOUSE_STAFF'],
      default: 'WAREHOUSE_STAFF',
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
    },
    resetPasswordOtp: String,
    resetPasswordOtpExpires: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
