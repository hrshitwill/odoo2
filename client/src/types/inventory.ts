export type DocumentType = 'receipt' | 'delivery' | 'transfer' | 'adjustment';

export type OperationStatus =
  | 'ready'
  | 'in_progress'
  | 'submitted'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'draft'
  | 'waiting'
  | 'done'
  | 'cancelled'
  | 'READY'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type UserRole = 'inventory_manager' | 'warehouse_staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
  warehouseId: string;
  assignedWarehouseName?: string;
}

export interface WarehouseLocation {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
  type: 'rack' | 'receiving' | 'staging' | 'floor' | 'shipping';
  capacity?: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  isMain?: boolean;
  locations: WarehouseLocation[];
}

export interface ProductLocationStock {
  locationId: string;
  locationName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  reserved: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  reorderPoint: number;
  maxStock: number;
  locationStock: ProductLocationStock[];
  description?: string;
  supplierName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptItem {
  productId: string;
  productName: string;
  sku: string;
  quantityExpected: number;
  quantityReceived: number;
  unitOfMeasure: string;
  unitCost: number;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  supplierName: string;
  destinationWarehouseId: string;
  destinationLocationId: string;
  destinationLocationName: string;
  items: ReceiptItem[];
  status: OperationStatus;
  notes?: string;
  createdAt: string;
  createdByName: string;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  validatedAt?: string;
}

export type DeliveryStage = 'draft' | 'pick' | 'pack' | 'validate' | 'done' | 'cancelled';

export interface DeliveryItem {
  productId: string;
  productName: string;
  sku: string;
  quantityRequested: number;
  quantityPicked: number;
  quantityPacked: number;
  unitOfMeasure: string;
}

export interface DeliveryOrder {
  id: string;
  deliveryNumber: string;
  customerName: string;
  sourceWarehouseId: string;
  sourceLocationId: string;
  sourceLocationName: string;
  items: DeliveryItem[];
  stage: DeliveryStage;
  status: OperationStatus;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  createdByName: string;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  validatedAt?: string;
}

export interface InternalTransferItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitOfMeasure: string;
}

export interface InternalTransfer {
  id: string;
  transferNumber: string;
  sourceWarehouseId: string;
  sourceLocationId: string;
  sourceLocationName: string;
  destinationWarehouseId: string;
  destinationLocationId: string;
  destinationLocationName: string;
  items: InternalTransferItem[];
  status: OperationStatus;
  scheduledDate: string;
  createdByName: string;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  completedAt?: string;
  notes?: string;
}

export type AdjustmentReason =
  | 'Damaged'
  | 'Inventory Count / Cycle'
  | 'Lost Goods'
  | 'Found Goods'
  | 'Theft'
  | 'Expiry'
  | 'Calibration Error';

export interface StockAdjustmentItem {
  productId: string;
  productName: string;
  sku: string;
  locationId?: string;
  locationName?: string;
  recordedQuantity: number;
  systemQuantity?: number;
  physicalQuantity: number;
  difference: number;
  unitOfMeasure: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  warehouseName: string;
  items: StockAdjustmentItem[];
  reason: AdjustmentReason;
  notes?: string;
  status: OperationStatus;
  createdAt: string;
  createdByName: string;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  validatedByName?: string;
  validatedAt?: string;
}

export interface StockLedgerEntry {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  sku: string;
  operationType: 'Receipt' | 'Delivery' | 'Internal Transfer' | 'Adjustment' | 'Initial Stock';
  referenceNumber: string;
  sourceLocationName: string;
  destinationLocationName: string;
  quantityDelta: number;
  unitOfMeasure: string;
  resultingTotalStock: number;
  userName: string;
  status: 'Completed' | 'Pending' | 'Reversed';
  notes?: string;
}

export interface ReorderingRule {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  minStock: number;
  maxStock: number;
  reorderQuantity: number;
  unitOfMeasure: string;
  isActive: boolean;
  leadTimeDays: number;
  supplierName: string;
  lastTriggeredAt?: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  productCount: number;
}

export interface PendingApprovalItem {
  id: string;
  operationType: 'Receipt' | 'Delivery' | 'Internal Transfer' | 'Adjustment';
  documentId: string;
  staffMember: string;
  warehouse: string;
  warehouseId: string;
  quantity: string;
  timestamp: string;
  status: string;
  details: string;
  rejectionReason?: string;
  rawOperation: Receipt | DeliveryOrder | InternalTransfer | StockAdjustment;
}

export interface StaffActivityItem {
  id: string;
  timestamp: string;
  time: string;
  action: string;
  reference: string;
  status: string;
  details?: string;
}
