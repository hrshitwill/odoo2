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
      enum: [
        'READY',
        'IN_PROGRESS',
        'SUBMITTED',
        'AWAITING_APPROVAL',
        'APPROVED',
        'REJECTED',
        'COMPLETED',
        'DRAFT',
        'WAITING',
        'DONE',
        'CANCELED',
      ],
      default: 'READY',
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
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
    stage: {
      type: String,
      enum: ['draft', 'pick', 'pack', 'validate', 'done', 'cancelled'],
      default: 'draft',
    },
    systemQty: {
      type: Number,
    },
    countedQty: {
      type: Number,
    },
    difference: {
      type: Number,
    },
    adjustmentReason: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      default: '',
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
