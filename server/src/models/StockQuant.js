const mongoose = require('mongoose');

const stockQuantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

stockQuantSchema.index({ product: 1, location: 1 }, { unique: true });

module.exports = mongoose.model('StockQuant', stockQuantSchema);
