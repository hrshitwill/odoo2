const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema(
  {
    operation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockOperation',
      default: null,
    },
    reference: {
      type: String,
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    fromLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    toLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StockLedger', stockLedgerSchema);
