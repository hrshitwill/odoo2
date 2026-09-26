const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
    },
    type: {
      type: String,
      enum: ['INTERNAL', 'VENDOR', 'CUSTOMER', 'INVENTORY_LOSS'],
      default: 'INTERNAL',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Location', locationSchema);
