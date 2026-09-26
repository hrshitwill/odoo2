const mongoose = require('mongoose');

const stockOperationItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  demandQty: {
    type: Number,
    required: true,
    min: 0,
  },
  doneQty: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const stockOperationSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['RECEIPT', 'DELIVERY', 'INTERNAL', 'ADJUSTMENT'],
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'],
      default: 'DRAFT',
    },
    partner: {
      type: String,
      default: '',
      trim: true,
    },
    sourceLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    destLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    items: [stockOperationItemSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    validatedAt: {
      type: Date,
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

module.exports = mongoose.model('StockOperation', stockOperationSchema);
