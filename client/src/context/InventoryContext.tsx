'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Product,
  Warehouse,
  Receipt,
  DeliveryOrder,
  InternalTransfer,
  StockAdjustment,
  StockLedgerEntry,
  ReorderingRule,
  InventoryCategory,
  User,
  OperationStatus,
  DeliveryStage,
  AdjustmentReason,
  PendingApprovalItem,
  StaffActivityItem,
} from '@/types/inventory';
import { useAuth } from '@/context/AuthContext';
import {
  INITIAL_USER,
  SECONDARY_USER,
  INITIAL_WAREHOUSES,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_RECEIPTS,
  INITIAL_DELIVERIES,
  INITIAL_TRANSFERS,
  INITIAL_ADJUSTMENTS,
  INITIAL_LEDGER,
  INITIAL_REORDER_RULES,
  INITIAL_STAFF_ACTIVITY,
} from '@/lib/initialData';

interface InventoryContextType {
  // Current user / auth
  currentUser: User;
  switchUserRole: (role: 'inventory_manager' | 'warehouse_staff') => void;
  updateCurrentUser: (userData: Partial<User>) => void;

  // Master Data
  products: Product[];
  warehouses: Warehouse[];
  categories: InventoryCategory[];
  reorderRules: ReorderingRule[];

  // Operations
  receipts: Receipt[];
  deliveries: DeliveryOrder[];
  transfers: InternalTransfer[];
  adjustments: StockAdjustment[];
  ledger: StockLedgerEntry[];
  staffActivity: StaffActivityItem[];
  pendingApprovals: PendingApprovalItem[];

  // Actions - Products
  addProduct: (productData: {
    name: string;
    sku: string;
    category: string;
    unitOfMeasure: string;
    costPrice: number;
    sellingPrice: number;
    reorderPoint: number;
    maxStock: number;
    initialStock?: number;
    initialWarehouseId?: string;
    initialLocationId?: string;
    description?: string;
    supplierName?: string;
  }) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getTotalStockForProduct: (product: Product) => number;
  getAvailableStockForProduct: (product: Product) => number;

  // Actions - Receipts (Two-Role Workflow)
  createReceipt: (data: {
    supplierName: string;
    destinationWarehouseId: string;
    destinationLocationId: string;
    items: {
      productId: string;
      quantityExpected: number;
      unitCost: number;
    }[];
    notes?: string;
  }) => Receipt;
  confirmPhysicalIntake: (receiptId: string) => boolean;
  approveReceipt: (receiptId: string) => boolean;
  rejectReceipt: (receiptId: string, reason?: string) => boolean;
  validateReceipt: (receiptId: string) => boolean;
  cancelReceipt: (receiptId: string) => void;

  // Actions - Deliveries (Two-Role Workflow)
  createDelivery: (data: {
    customerName: string;
    sourceWarehouseId: string;
    sourceLocationId: string;
    items: {
      productId: string;
      quantityRequested: number;
    }[];
    notes?: string;
  }) => DeliveryOrder;
  startPicking: (deliveryId: string) => boolean;
  confirmPacking: (deliveryId: string) => boolean;
  submitDelivery: (deliveryId: string) => boolean;
  approveDelivery: (deliveryId: string) => boolean;
  rejectDelivery: (deliveryId: string, reason?: string) => boolean;
  advanceDeliveryStage: (deliveryId: string, nextStage?: DeliveryStage) => boolean;
  cancelDelivery: (deliveryId: string) => void;

  // Actions - Internal Transfers (Two-Role Workflow)
  createInternalTransfer: (data: {
    sourceWarehouseId: string;
    sourceLocationId: string;
    destinationWarehouseId: string;
    destinationLocationId: string;
    items: {
      productId: string;
      quantity: number;
    }[];
    scheduledDate?: string;
    notes?: string;
  }) => InternalTransfer;
  reportTransferComplete: (transferId: string) => boolean;
  approveTransfer: (transferId: string) => boolean;
  rejectTransfer: (transferId: string, reason?: string) => boolean;
  validateTransfer: (transferId: string) => boolean;
  cancelTransfer: (transferId: string) => void;

  // Actions - Stock Adjustments (Two-Role Workflow)
  createStockAdjustment: (data: {
    warehouseId: string;
    reason: AdjustmentReason;
    notes?: string;
    items: {
      productId: string;
      locationId: string;
      physicalQuantity: number;
    }[];
  }) => StockAdjustment;
  submitStockCount: (data: {
    warehouseId: string;
    reason: AdjustmentReason;
    notes?: string;
    items: {
      productId: string;
      locationId: string;
      physicalQuantity: number;
    }[];
  }) => StockAdjustment;
  approveAdjustment: (adjustmentId: string) => boolean;
  rejectAdjustment: (adjustmentId: string, reason?: string) => boolean;
  validateStockAdjustment: (adjustmentId: string) => boolean;

  // Unified Approval Actions
  approvePendingOperation: (item: PendingApprovalItem) => boolean;
  rejectPendingOperation: (item: PendingApprovalItem, reason?: string) => boolean;

  // Actions - Reordering Rules
  addReorderRule: (rule: Omit<ReorderingRule, 'id'>) => void;
  updateReorderRule: (id: string, updates: Partial<ReorderingRule>) => void;
  deleteReorderRule: (id: string) => void;

  // Actions - Warehouses & Locations
  addWarehouse: (data: { name: string; code: string; address: string }) => Warehouse;
  addLocation: (data: {
    warehouseId: string;
    name: string;
    code: string;
    type: 'rack' | 'receiving' | 'staging' | 'floor' | 'shipping';
    capacity?: number;
  }) => void;

  // Global KPIs & Alerts
  kpis: {
    totalUnitsInStock: number;
    totalUniqueProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    pendingReceiptsCount: number;
    pendingDeliveriesCount: number;
    scheduledTransfersCount: number;
    pendingApprovalsCount: number;
  };
  lowStockAlerts: {
    product: Product;
    currentStock: number;
    reorderPoint: number;
    suggestedOrderQty: number;
    isOutOfStock: boolean;
  }[];

  // Role-Based Scoped Data
  scopedReceipts: Receipt[];
  scopedDeliveries: DeliveryOrder[];
  scopedTransfers: InternalTransfer[];
  scopedAdjustments: StockAdjustment[];
  scopedLedger: StockLedgerEntry[];
  scopedKpis: {
    totalUnitsInStock: number;
    totalUniqueProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    pendingReceiptsCount: number;
    pendingDeliveriesCount: number;
    scheduledTransfersCount: number;
    pendingApprovalsCount: number;
  };
  scopedLowStockAlerts: {
    product: Product;
    currentStock: number;
    reorderPoint: number;
    suggestedOrderQty: number;
    isOutOfStock: boolean;
  }[];

  // System
  resetAllData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEY = 'stocksense_ims_state_v2';

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [currentUser, setCurrentUser] = useState<User>(auth?.user || INITIAL_USER);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [categories, setCategories] = useState<InventoryCategory[]>(INITIAL_CATEGORIES);
  const [receipts, setReceipts] = useState<Receipt[]>(INITIAL_RECEIPTS);
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>(INITIAL_DELIVERIES);
  const [transfers, setTransfers] = useState<InternalTransfer[]>(INITIAL_TRANSFERS);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(INITIAL_ADJUSTMENTS);
  const [ledger, setLedger] = useState<StockLedgerEntry[]>(INITIAL_LEDGER);
  const [staffActivity, setStaffActivity] = useState<StaffActivityItem[]>(INITIAL_STAFF_ACTIVITY);
  const [reorderRules, setReorderRules] = useState<ReorderingRule[]>(INITIAL_REORDER_RULES);
  const [isHydrated, setIsHydrated] = useState(false);

  // Sync with AuthContext user
  useEffect(() => {
    if (auth?.user) {
      setCurrentUser(auth.user);
    }
  }, [auth?.user]);

  // Hydrate from localStorage on client load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.products) setProducts(parsed.products);
        if (parsed.warehouses) setWarehouses(parsed.warehouses);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.receipts) setReceipts(parsed.receipts);
        if (parsed.deliveries) setDeliveries(parsed.deliveries);
        if (parsed.transfers) setTransfers(parsed.transfers);
        if (parsed.adjustments) setAdjustments(parsed.adjustments);
        if (parsed.ledger) setLedger(parsed.ledger);
        if (parsed.staffActivity) setStaffActivity(parsed.staffActivity);
        if (parsed.reorderRules) setReorderRules(parsed.reorderRules);
        if (parsed.currentUser && !auth?.user) setCurrentUser(parsed.currentUser);
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }
    setIsHydrated(true);
  }, [auth?.user]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentUser,
          products,
          warehouses,
          categories,
          receipts,
          deliveries,
          transfers,
          adjustments,
          ledger,
          staffActivity,
          reorderRules,
        })
      );
    } catch (e) {
      console.error('Failed to persist state to localStorage', e);
    }
  }, [
    isHydrated,
    currentUser,
    products,
    warehouses,
    categories,
    receipts,
    deliveries,
    transfers,
    adjustments,
    ledger,
    staffActivity,
    reorderRules,
  ]);

  const switchUserRole = (role: 'inventory_manager' | 'warehouse_staff') => {
    const updated = role === 'inventory_manager' ? INITIAL_USER : SECONDARY_USER;
    setCurrentUser(updated);
  };

  const updateCurrentUser = (userData: Partial<User>) => {
    setCurrentUser((prev) => ({ ...prev, ...userData }));
  };

  // Helper calculation functions
  const getTotalStockForProduct = (product: Product): number => {
    if (!product || !product.locationStock) return 0;
    return product.locationStock.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const getAvailableStockForProduct = (product: Product): number => {
    if (!product || !product.locationStock) return 0;
    return product.locationStock.reduce((sum, item) => sum + Math.max(0, (item.quantity || 0) - (item.reserved || 0)), 0);
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find((p) => p.id === id);
  };

  // Add Product (Manager only)
  const addProduct = (data: {
    name: string;
    sku: string;
    category: string;
    unitOfMeasure: string;
    costPrice: number;
    sellingPrice: number;
    reorderPoint: number;
    maxStock: number;
    initialStock?: number;
    initialWarehouseId?: string;
    initialLocationId?: string;
    description?: string;
    supplierName?: string;
  }): Product => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Only Inventory Managers can create products.');
    }

    const whId = data.initialWarehouseId || 'wh-main';
    const locId = data.initialLocationId || 'loc-main-ra';
    const wh = warehouses.find((w) => w.id === whId);
    const loc = wh?.locations.find((l) => l.id === locId);
    const initStock = data.initialStock || 0;

    const newProduct: Product = {
      id: `prod-${Date.now().toString().slice(-4)}`,
      name: data.name,
      sku: data.sku.toUpperCase(),
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      category: data.category,
      unitOfMeasure: data.unitOfMeasure,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      reorderPoint: data.reorderPoint,
      maxStock: data.maxStock,
      description: data.description,
      supplierName: data.supplierName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      locationStock: [
        {
          locationId: locId,
          locationName: loc ? loc.name : 'Heavy Rack A',
          warehouseId: whId,
          warehouseName: wh ? wh.name : 'Main Central Hub',
          quantity: initStock,
          reserved: 0,
        },
      ],
    };

    setProducts((prev) => [newProduct, ...prev]);

    if (initStock > 0) {
      const ledgerEntry: StockLedgerEntry = {
        id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        operationType: 'Initial Stock',
        referenceNumber: `INIT-${newProduct.sku}`,
        sourceLocationName: 'Initial Inventory Setup',
        destinationLocationName: `${wh?.name || 'Warehouse'} → ${loc?.name || 'Rack'}`,
        quantityDelta: initStock,
        unitOfMeasure: newProduct.unitOfMeasure,
        resultingTotalStock: initStock,
        userName: currentUser.name,
        status: 'Completed',
        notes: 'Initial stock intake on product creation.',
      };
      setLedger((prev) => [ledgerEntry, ...prev]);
    }

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Only Inventory Managers can modify products.');
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  };

  const deleteProduct = (id: string) => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Only Inventory Managers can delete products.');
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Helper to record staff activity
  const logStaffActivity = (action: string, reference: string, status: string, details?: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const newAct: StaffActivityItem = {
      id: `act-${Date.now()}`,
      timestamp: now.toISOString(),
      time: timeStr,
      action,
      reference,
      status,
      details,
    };
    setStaffActivity((prev) => [newAct, ...prev]);
  };

  // =========================================================================
  // RECEIVING WORKFLOW:
  // Staff: Confirm Physical Intake -> AWAITING APPROVAL (Stock unchanged)
  // Manager: Approve Receipt -> COMPLETED (Stock increases + Stock Ledger entry)
  // Manager: Reject -> REJECTED (Stock unchanged)
  // =========================================================================

  const createReceipt = (data: {
    supplierName: string;
    destinationWarehouseId: string;
    destinationLocationId: string;
    items: {
      productId: string;
      quantityExpected: number;
      unitCost: number;
    }[];
    notes?: string;
  }): Receipt => {
    const wh = warehouses.find((w) => w.id === data.destinationWarehouseId) || warehouses[0];
    const loc = wh.locations.find((l) => l.id === data.destinationLocationId) || wh.locations[0];
    const receiptNumber = `REC-${Math.floor(1050 + receipts.length)}`;

    const items = data.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod ? prod.name : 'Unknown Product',
        sku: prod ? prod.sku : 'UNK',
        quantityExpected: item.quantityExpected,
        quantityReceived: item.quantityExpected,
        unitOfMeasure: prod ? prod.unitOfMeasure : 'units',
        unitCost: item.unitCost,
      };
    });

    const newReceipt: Receipt = {
      id: `rec-${Date.now().toString().slice(-4)}`,
      receiptNumber,
      supplierName: data.supplierName,
      destinationWarehouseId: wh.id,
      destinationLocationId: loc.id,
      destinationLocationName: `${wh.name} → ${loc.name}`,
      status: 'ready',
      items,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      createdByName: currentUser.name,
    };

    setReceipts((prev) => [newReceipt, ...prev]);
    return newReceipt;
  };

  // Staff Action: Confirm Physical Intake -> moves to AWAITING APPROVAL without changing stock!
  const confirmPhysicalIntake = (receiptId: string): boolean => {
    const receipt = receipts.find((r) => r.id === receiptId);
    if (!receipt || receipt.status === 'completed' || receipt.status === 'done' || receipt.status === 'awaiting_approval') {
      return false;
    }

    const nowIso = new Date().toISOString();
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receiptId
          ? {
              ...r,
              status: 'awaiting_approval',
              submittedBy: currentUser.name,
              submittedAt: nowIso,
            }
          : r
      )
    );

    logStaffActivity(
      'Receipt submitted',
      receipt.receiptNumber,
      'Awaiting approval',
      `${receipt.supplierName} • ${receipt.items[0]?.quantityReceived || 100} ${receipt.items[0]?.unitOfMeasure || 'units'}`
    );

    return true;
  };

  // Manager Action: Approve Receipt -> increases official inventory and logs to Stock Ledger
  const approveReceipt = (receiptId: string): boolean => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Authority denied. Only an Inventory Manager can approve receipts.');
    }

    const receipt = receipts.find((r) => r.id === receiptId);
    if (!receipt || receipt.status === 'completed' || receipt.status === 'done') return false;

    const nowIso = new Date().toISOString();

    // 1. Official Inventory Increase
    setProducts((prevProducts) => {
      return prevProducts.map((product) => {
        const item = receipt.items.find((i) => i.productId === product.id);
        if (!item) return product;

        const qtyToAdd = item.quantityReceived || item.quantityExpected;
        const currentLocStocks = [...(product.locationStock || [])];
        const existingLocIndex = currentLocStocks.findIndex(
          (ls) => ls.locationId === receipt.destinationLocationId
        );

        const wh = warehouses.find((w) => w.id === receipt.destinationWarehouseId);
        const loc = wh?.locations.find((l) => l.id === receipt.destinationLocationId);

        if (existingLocIndex >= 0) {
          currentLocStocks[existingLocIndex] = {
            ...currentLocStocks[existingLocIndex],
            quantity: currentLocStocks[existingLocIndex].quantity + qtyToAdd,
          };
        } else {
          currentLocStocks.push({
            locationId: receipt.destinationLocationId,
            locationName: loc ? loc.name : 'Receiving Bay A',
            warehouseId: receipt.destinationWarehouseId,
            warehouseName: wh ? wh.name : 'Main Central Hub',
            quantity: qtyToAdd,
            reserved: 0,
          });
        }

        return {
          ...product,
          locationStock: currentLocStocks,
          updatedAt: nowIso,
        };
      });
    });

    // 2. Mark receipt completed
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receiptId
          ? {
              ...r,
              status: 'completed',
              approvedBy: currentUser.name,
              approvedAt: nowIso,
              validatedAt: nowIso,
            }
          : r
      )
    );

    // 3. Create Stock Ledger entry
    receipt.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const qtyAdded = item.quantityReceived || item.quantityExpected;
      const prevTotal = prod ? getTotalStockForProduct(prod) : 0;

      const ledgerEntry: StockLedgerEntry = {
        id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: nowIso,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        operationType: 'Receipt',
        referenceNumber: receipt.receiptNumber,
        sourceLocationName: `Vendor: ${receipt.supplierName}`,
        destinationLocationName: receipt.destinationLocationName,
        quantityDelta: qtyAdded,
        unitOfMeasure: item.unitOfMeasure,
        resultingTotalStock: prevTotal + qtyAdded,
        userName: currentUser.name,
        status: 'Completed',
        notes: `Receipt approved by Manager ${currentUser.name}. Inbound freight received into official stock.`,
      };

      setLedger((prev) => [ledgerEntry, ...prev]);
    });

    // Update staff activity status to Completed
    setStaffActivity((prev) =>
      prev.map((act) =>
        act.reference === receipt.receiptNumber ? { ...act, status: 'Completed' } : act
      )
    );

    return true;
  };

  // Manager Action: Reject Receipt
  const rejectReceipt = (receiptId: string, reason = 'Intake rejected by Manager'): boolean => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Authority denied. Only an Inventory Manager can reject receipts.');
    }

    const receipt = receipts.find((r) => r.id === receiptId);
    if (!receipt) return false;

    const nowIso = new Date().toISOString();
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receiptId
          ? {
              ...r,
              status: 'rejected',
              rejectedBy: currentUser.name,
              rejectedAt: nowIso,
              rejectionReason: reason,
            }
          : r
      )
    );

    // Update staff activity status to Rejected
    setStaffActivity((prev) =>
      prev.map((act) =>
        act.reference === receipt.receiptNumber ? { ...act, status: 'Rejected' } : act
      )
    );

    return true;
  };

  const validateReceipt = (receiptId: string): boolean => {
    if (currentUser.role === 'warehouse_staff') {
      return confirmPhysicalIntake(receiptId);
    }
    return approveReceipt(receiptId);
  };

  const cancelReceipt = (receiptId: string) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === receiptId ? { ...r, status: 'cancelled' } : r))
    );
  };

  // =========================================================================
  // DELIVERY WORKFLOW:
  // Staff: Start Picking -> Confirm Packing -> Submit Delivery -> AWAITING APPROVAL
  // Manager: Approve Dispatch -> COMPLETED (Stock decreases)
  // Manager: Reject -> REJECTED (Stock unchanged)
  // =========================================================================

  const createDelivery = (data: {
    customerName: string;
    sourceWarehouseId: string;
    sourceLocationId: string;
    items: {
      productId: string;
      quantityRequested: number;
    }[];
    notes?: string;
  }): DeliveryOrder => {
    const wh = warehouses.find((w) => w.id === data.sourceWarehouseId) || warehouses[0];
    const loc = wh.locations.find((l) => l.id === data.sourceLocationId) || wh.locations[0];
    const deliveryNumber = `DEL-${Math.floor(1055 + deliveries.length)}`;

    const items = data.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod ? prod.name : 'Unknown Product',
        sku: prod ? prod.sku : 'UNK',
        quantityRequested: item.quantityRequested,
        quantityPicked: 0,
        quantityPacked: 0,
        unitOfMeasure: prod ? prod.unitOfMeasure : 'units',
      };
    });

    const newDelivery: DeliveryOrder = {
      id: `del-${Date.now().toString().slice(-4)}`,
      deliveryNumber,
      customerName: data.customerName,
      sourceWarehouseId: wh.id,
      sourceLocationId: loc.id,
      sourceLocationName: `${wh.name} → ${loc.name}`,
      stage: 'pick',
      status: 'ready',
      trackingNumber: `TRK-${Math.floor(9832150 + deliveries.length)}`,
      items,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      createdByName: currentUser.name,
    };

    setDeliveries((prev) => [newDelivery, ...prev]);
    return newDelivery;
  };

  const startPicking = (deliveryId: string): boolean => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              stage: 'pick',
              status: 'in_progress',
              items: d.items.map((i) => ({ ...i, quantityPicked: i.quantityRequested })),
            }
          : d
      )
    );
    return true;
  };

  const confirmPacking = (deliveryId: string): boolean => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              stage: 'pack',
              status: 'in_progress',
              items: d.items.map((i) => ({ ...i, quantityPacked: i.quantityRequested })),
            }
          : d
      )
    );
    return true;
  };

  const submitDelivery = (deliveryId: string): boolean => {
    const order = deliveries.find((d) => d.id === deliveryId);
    if (!order) return false;

    const nowIso = new Date().toISOString();
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              stage: 'pack',
              status: 'awaiting_approval',
              submittedBy: currentUser.name,
              submittedAt: nowIso,
              items: d.items.map((i) => ({
                ...i,
                quantityPicked: i.quantityRequested,
                quantityPacked: i.quantityRequested,
              })),
            }
          : d
      )
    );

    logStaffActivity(
      'Delivery packed',
      order.deliveryNumber,
      'Awaiting approval',
      `${order.customerName} • Picked & Packed ${order.items[0]?.quantityRequested || 10} units`
    );

    return true;
  };

  // Manager Action: Approve Dispatch -> Deduct official stock
  const approveDelivery = (deliveryId: string): boolean => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Authority denied. Only an Inventory Manager can approve delivery dispatch.');
    }

    const order = deliveries.find((d) => d.id === deliveryId);
    if (!order || order.status === 'completed' || order.status === 'done') return false;

    const nowIso = new Date().toISOString();

    // 1. Deduct stock from source location
    setProducts((prevProducts) => {
      return prevProducts.map((product) => {
        const itemToDeliver = order.items.find((i) => i.productId === product.id);
        if (!itemToDeliver) return product;

        const qtyToDeduct = itemToDeliver.quantityPacked || itemToDeliver.quantityRequested;
        const currentLocStocks = [...(product.locationStock || [])];
        const existingLocIndex = currentLocStocks.findIndex(
          (ls) => ls.locationId === order.sourceLocationId
        );

        if (existingLocIndex >= 0) {
          currentLocStocks[existingLocIndex] = {
            ...currentLocStocks[existingLocIndex],
            quantity: Math.max(0, currentLocStocks[existingLocIndex].quantity - qtyToDeduct),
          };
        }

        return {
          ...product,
          locationStock: currentLocStocks,
          updatedAt: nowIso,
        };
      });
    });

    // 2. Mark delivery completed
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              stage: 'done',
              status: 'completed',
              approvedBy: currentUser.name,
              approvedAt: nowIso,
              validatedAt: nowIso,
            }
          : d
      )
    );

    // 3. Add to Stock Ledger
    order.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const prevTotal = prod ? getTotalStockForProduct(prod) : 0;
      const qtyDeducted = item.quantityPacked || item.quantityRequested;

      const ledgerEntry: StockLedgerEntry = {
        id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: nowIso,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        operationType: 'Delivery',
        referenceNumber: order.deliveryNumber,
        sourceLocationName: order.sourceLocationName,
        destinationLocationName: `Customer: ${order.customerName}`,
        quantityDelta: -qtyDeducted,
        unitOfMeasure: item.unitOfMeasure,
        resultingTotalStock: Math.max(0, prevTotal - qtyDeducted),
        userName: currentUser.name,
        status: 'Completed',
        notes: `Dispatch approved by Manager ${currentUser.name}. Carrier outbound released.`,
      };
      setLedger((prev) => [ledgerEntry, ...prev]);
    });

    // Update staff activity
    setStaffActivity((prev) =>
      prev.map((act) =>
        act.reference === order.deliveryNumber ? { ...act, status: 'Completed' } : act
      )
    );

    return true;
  };

  // Manager Action: Reject Delivery
  const rejectDelivery = (deliveryId: string, reason = 'Dispatch rejected by Manager'): boolean => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Authority denied. Only an Inventory Manager can reject deliveries.');
    }

    const order = deliveries.find((d) => d.id === deliveryId);
    if (!order) return false;

    const nowIso = new Date().toISOString();
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              status: 'rejected',
              rejectedBy: currentUser.name,
              rejectedAt: nowIso,
              rejectionReason: reason,
            }
          : d
      )
    );

    setStaffActivity((prev) =>
      prev.map((act) =>
        act.reference === order.deliveryNumber ? { ...act, status: 'Rejected' } : act
      )
    );

    return true;
  };

  const advanceDeliveryStage = (deliveryId: string, nextStage?: DeliveryStage): boolean => {
    const order = deliveries.find((d) => d.id === deliveryId);
    if (!order) return false;

    if (currentUser.role === 'warehouse_staff') {
      if (order.stage === 'draft' || order.stage === 'pick') {
        return confirmPacking(deliveryId);
      }
      return submitDelivery(deliveryId);
    }

    // Manager
    if (nextStage === 'done' || order.status === 'awaiting_approval') {
      return approveDelivery(deliveryId);
    }
    return submitDelivery(deliveryId);
  };

  const cancelDelivery = (deliveryId: string) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, status: 'cancelled', stage: 'cancelled' } : d))
    );
  };

  // =========================================================================
  // INTERNAL TRANSFER WORKFLOW:
  // Staff: Report Transfer Complete -> AWAITING APPROVAL (Stock locations unchanged)
  // Manager: Approve Transfer -> COMPLETED (source decreases, dest increases, total unchanged)
  // Manager: Reject -> REJECTED (Stock locations unchanged)
  // =========================================================================

  const createInternalTransfer = (data: {
    sourceWarehouseId: string;
    sourceLocationId: string;
    destinationWarehouseId: string;
    destinationLocationId: string;
    items: {
      productId: string;
      quantity: number;
    }[];
    scheduledDate?: string;
    notes?: string;
  }): InternalTransfer => {
    const srcWh = warehouses.find((w) => w.id === data.sourceWarehouseId) || warehouses[0];
    const srcLoc = srcWh.locations.find((l) => l.id === data.sourceLocationId) || srcWh.locations[0];

    const destWh = warehouses.find((w) => w.id === data.destinationWarehouseId) || warehouses[1] || warehouses[0];
    const destLoc = destWh.locations.find((l) => l.id === data.destinationLocationId) || destWh.locations[0];

    const transferNumber = `TRF-0${203 + transfers.length}`;

    const items = data.items.map((i) => {
      const prod = products.find((p) => p.id === i.productId);
      return {
        productId: i.productId,
        productName: prod ? prod.name : 'Unknown Product',
        sku: prod ? prod.sku : 'UNK',
        quantity: i.quantity,
        unitOfMeasure: prod ? prod.unitOfMeasure : 'units',
      };
    });

    const newTransfer: InternalTransfer = {
      id: `trf-${Date.now().toString().slice(-4)}`,
      transferNumber,
      sourceWarehouseId: srcWh.id,
      sourceLocationId: srcLoc.id,
      sourceLocationName: `${srcWh.name} [${srcLoc.name}]`,
      destinationWarehouseId: destWh.id,
      destinationLocationId: destLoc.id,
      destinationLocationName: `${destWh.name} [${destLoc.name}]`,
      items,
      status: 'ready',
      scheduledDate: data.scheduledDate || new Date().toISOString(),
      createdByName: currentUser.name,
      notes: data.notes,
    };

    setTransfers((prev) => [newTransfer, ...prev]);
    return newTransfer;
  };

  // Staff Action: Report physical movement complete
  const reportTransferComplete = (transferId: string): boolean => {
    const transfer = transfers.find((t) => t.id === transferId);
    if (!transfer) return false;

    const nowIso = new Date().toISOString();
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? {
              ...t,
              status: 'awaiting_approval',
              submittedBy: currentUser.name,
              submittedAt: nowIso,
            }
          : t
      )
    );

    logStaffActivity(
      'Transfer submitted',
      transfer.transferNumber,
      'Awaiting approval',
      `${transfer.sourceLocationName} → ${transfer.destinationLocationName} (${transfer.items[0]?.quantity || 25} ${transfer.items[0]?.unitOfMeasure || 'units'})`
    );

    return true;
  };

  // Manager Action: Approve Transfer
  const approveTransfer = (transferId: string): boolean => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Authority denied. Only an Inventory Manager can approve transfers.');
    }

    const transfer = transfers.find((t) => t.id === transferId);
    if (!transfer || transfer.status === 'completed' || transfer.status === 'done') return false;

    const nowIso = new Date().toISOString();

    // Source decreases, Destination increases, Total company stock unchanged
    setProducts((prevProducts) => {
      return prevProducts.map((product) => {
        const item = transfer.items.find((i) => i.productId === product.id);
        if (!item) return product;

        const currentStocks = [...(product.locationStock || [])];

        // Deduct from source
        const srcIndex = currentStocks.findIndex((s) => s.locationId === transfer.sourceLocationId);
        if (srcIndex >= 0) {
          currentStocks[srcIndex] = {
            ...currentStocks[srcIndex],
            quantity: Math.max(0, currentStocks[srcIndex].quantity - item.quantity),
          };
        }

        // Add to destination
        const destWh = warehouses.find((w) => w.id === transfer.destinationWarehouseId);
        const destLoc = destWh?.locations.find((l) => l.id === transfer.destinationLocationId);
        const destIndex = currentStocks.findIndex((s) => s.locationId === transfer.destinationLocationId);

        if (destIndex >= 0) {
          currentStocks[destIndex] = {
            ...currentStocks[destIndex],
            quantity: currentStocks[destIndex].quantity + item.quantity,
          };
        } else {
          currentStocks.push({
            locationId: transfer.destinationLocationId,
            locationName: destLoc ? destLoc.name : 'Target Bay',
            warehouseId: transfer.destinationWarehouseId,
            warehouseName: destWh ? destWh.name : 'Main Central Hub',
            quantity: item.quantity,
            reserved: 0,
          });
        }

        return {
          ...product,
          locationStock: currentStocks,
          updatedAt: nowIso,
        };
      });
    });

    // Mark transfer completed
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? {
              ...t,
              status: 'completed',
              approvedBy: currentUser.name,
              approvedAt: nowIso,
              completedAt: nowIso,
            }
          : t
      )
    );

    // Ledger entry
    transfer.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const total = prod ? getTotalStockForProduct(prod) : 0;

      const ledgerEntry: StockLedgerEntry = {
        id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: nowIso,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        operationType: 'Internal Transfer',
        referenceNumber: transfer.transferNumber,
        sourceLocationName: transfer.sourceLocationName,
        destinationLocationName: transfer.destinationLocationName,
        quantityDelta: 0,
        unitOfMeasure: item.unitOfMeasure,
        resultingTotalStock: total,
        userName: currentUser.name,
        status: 'Completed',
        notes: `Transfer approved by Manager ${currentUser.name}. Stock relocated between facility bays.`,
      };

      setLedger((prev) => [ledgerEntry, ...prev]);
    });

    // Update staff activity
    setStaffActivity((prev) =>
      prev.map((act) =>
        act.reference === transfer.transferNumber ? { ...act, status: 'Completed' } : act
      )
    );

    return true;
  };

  // Manager Action: Reject Transfer
  const rejectTransfer = (transferId: string, reason = 'Transfer rejected by Manager'): boolean => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Authority denied. Only an Inventory Manager can reject transfers.');
    }

    const transfer = transfers.find((t) => t.id === transferId);
    if (!transfer) return false;

    const nowIso = new Date().toISOString();
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? {
              ...t,
              status: 'rejected',
              rejectedBy: currentUser.name,
              rejectedAt: nowIso,
              rejectionReason: reason,
            }
          : t
      )
    );

    setStaffActivity((prev) =>
      prev.map((act) =>
        act.reference === transfer.transferNumber ? { ...act, status: 'Rejected' } : act
      )
    );

    return true;
  };

  const validateTransfer = (transferId: string): boolean => {
    if (currentUser.role === 'warehouse_staff') {
      return reportTransferComplete(transferId);
    }
    return approveTransfer(transferId);
  };

  const cancelTransfer = (transferId: string) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status: 'cancelled' } : t))
    );
  };

  // =========================================================================
  // STOCK ADJUSTMENT WORKFLOW:
  // Staff: Submit Count (System, Physical, Diff) -> AWAITING APPROVAL
  // Manager: Approve Adjustment -> COMPLETED (Official inventory updates)
  // Manager: Reject -> REJECTED (Stock unchanged)
  // =========================================================================

  const submitStockCount = (data: {
    warehouseId: string;
    reason: AdjustmentReason;
    notes?: string;
    items: {
      productId: string;
      locationId: string;
      physicalQuantity: number;
    }[];
  }): StockAdjustment => {
    const wh = warehouses.find((w) => w.id === data.warehouseId) || warehouses[0];
    const adjustmentNumber = `ADJ-0${43 + adjustments.length}`;
    const nowIso = new Date().toISOString();

    const adjustmentItems = data.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const loc = wh.locations.find((l) => l.id === item.locationId);
      const locStock = prod?.locationStock.find((ls) => ls.locationId === item.locationId);
      const recorded = locStock ? locStock.quantity : 0;
      const diff = item.physicalQuantity - recorded;

      return {
        productId: item.productId,
        productName: prod ? prod.name : 'Unknown Product',
        sku: prod ? prod.sku : 'UNK',
        locationId: item.locationId,
        locationName: loc ? loc.name : 'Standard Rack B',
        recordedQuantity: recorded,
        physicalQuantity: item.physicalQuantity,
        difference: diff,
        unitOfMeasure: prod ? prod.unitOfMeasure : 'units',
      };
    });

    const newAdjustment: StockAdjustment = {
      id: `adj-${Date.now().toString().slice(-4)}`,
      adjustmentNumber,
      warehouseId: wh.id,
      warehouseName: wh.name,
      reason: data.reason,
      notes: data.notes || 'Physical count submitted by warehouse floor staff. Awaiting Manager approval.',
      status: 'awaiting_approval',
      createdAt: nowIso,
      createdByName: currentUser.name,
      submittedBy: currentUser.name,
      submittedAt: nowIso,
      items: adjustmentItems,
    };

    setAdjustments((prev) => [newAdjustment, ...prev]);

    const item = adjustmentItems[0];
    logStaffActivity(
      'Count submitted',
      adjustmentNumber,
      'Awaiting approval',
      item ? `${item.productName}: ${item.recordedQuantity} → ${item.physicalQuantity} (${item.difference >= 0 ? '+' : ''}${item.difference})` : 'Discrepancy audit'
    );

    return newAdjustment;
  };

  const createStockAdjustment = (data: {
    warehouseId: string;
    reason: AdjustmentReason;
    notes?: string;
    items: {
      productId: string;
      locationId: string;
      physicalQuantity: number;
    }[];
  }): StockAdjustment => {
    if (currentUser.role === 'warehouse_staff') {
      return submitStockCount(data);
    }

    // Manager directly applying adjustment
    const adj = submitStockCount(data);
    approveAdjustment(adj.id);
    return adj;
  };

  // Manager Action: Approve Adjustment -> Updates official inventory
  const approveAdjustment = (adjustmentId: string): boolean => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Authority denied. Only an Inventory Manager can approve adjustments.');
    }

    const adj = adjustments.find((a) => a.id === adjustmentId);
    if (!adj || adj.status === 'completed' || adj.status === 'done') return false;

    const nowIso = new Date().toISOString();
    const wh = warehouses.find((w) => w.id === adj.warehouseId) || warehouses[0];

    // 1. Update official inventory to counted quantity
    setProducts((prevProducts) => {
      return prevProducts.map((product) => {
        const adjItem = adj.items.find((i) => i.productId === product.id);
        if (!adjItem) return product;

        const currentStocks = [...(product.locationStock || [])];
        const idx = currentStocks.findIndex((s) => s.locationId === adjItem.locationId);

        if (idx >= 0) {
          currentStocks[idx] = {
            ...currentStocks[idx],
            quantity: adjItem.physicalQuantity,
          };
        } else {
          currentStocks.push({
            locationId: adjItem.locationId || 'loc-main-ra',
            locationName: adjItem.locationName || 'Standard Bay',
            warehouseId: wh.id,
            warehouseName: wh.name,
            quantity: adjItem.physicalQuantity,
            reserved: 0,
          });
        }

        return {
          ...product,
          locationStock: currentStocks,
          updatedAt: nowIso,
        };
      });
    });

    // 2. Mark adjustment completed
    setAdjustments((prev) =>
      prev.map((a) =>
        a.id === adjustmentId
          ? {
              ...a,
              status: 'completed',
              approvedBy: currentUser.name,
              approvedAt: nowIso,
              validatedByName: currentUser.name,
              validatedAt: nowIso,
            }
          : a
      )
    );

    // 3. Write to Stock Ledger
    adj.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const newTotal = prod ? getTotalStockForProduct(prod) + item.difference : item.physicalQuantity;

      const ledgerEntry: StockLedgerEntry = {
        id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: nowIso,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        operationType: 'Adjustment',
        referenceNumber: adj.adjustmentNumber,
        sourceLocationName: `${wh.name} [${item.locationName}]`,
        destinationLocationName: item.difference >= 0 ? 'Surplus Audit Credit' : 'Scrap / Loss Audit Debit',
        quantityDelta: item.difference,
        unitOfMeasure: item.unitOfMeasure,
        resultingTotalStock: newTotal,
        userName: currentUser.name,
        status: 'Completed',
        notes: `Adjustment approved by Manager ${currentUser.name}: ${item.recordedQuantity} → ${item.physicalQuantity} (${item.difference >= 0 ? '+' : ''}${item.difference} ${item.unitOfMeasure}) [${adj.reason}].`,
      };

      setLedger((prev) => [ledgerEntry, ...prev]);
    });

    setStaffActivity((prev) =>
      prev.map((act) =>
        act.reference === adj.adjustmentNumber ? { ...act, status: 'Completed' } : act
      )
    );

    return true;
  };

  // Manager Action: Reject Adjustment
  const rejectAdjustment = (adjustmentId: string, reason = 'Physical count rejected by Manager'): boolean => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Authority denied. Only an Inventory Manager can reject adjustments.');
    }

    const adj = adjustments.find((a) => a.id === adjustmentId);
    if (!adj) return false;

    const nowIso = new Date().toISOString();
    setAdjustments((prev) =>
      prev.map((a) =>
        a.id === adjustmentId
          ? {
              ...a,
              status: 'rejected',
              rejectedBy: currentUser.name,
              rejectedAt: nowIso,
              rejectionReason: reason,
            }
          : a
      )
    );

    setStaffActivity((prev) =>
      prev.map((act) =>
        act.reference === adj.adjustmentNumber ? { ...act, status: 'Rejected' } : act
      )
    );

    return true;
  };

  const validateStockAdjustment = (adjustmentId: string): boolean => {
    return approveAdjustment(adjustmentId);
  };

  // Unified Approval Action Dispatchers
  const approvePendingOperation = (item: PendingApprovalItem): boolean => {
    switch (item.operationType) {
      case 'Receipt':
        return approveReceipt(item.id);
      case 'Delivery':
        return approveDelivery(item.id);
      case 'Internal Transfer':
        return approveTransfer(item.id);
      case 'Adjustment':
        return approveAdjustment(item.id);
      default:
        return false;
    }
  };

  const rejectPendingOperation = (item: PendingApprovalItem, reason?: string): boolean => {
    switch (item.operationType) {
      case 'Receipt':
        return rejectReceipt(item.id, reason);
      case 'Delivery':
        return rejectDelivery(item.id, reason);
      case 'Internal Transfer':
        return rejectTransfer(item.id, reason);
      case 'Adjustment':
        return rejectAdjustment(item.id, reason);
      default:
        return false;
    }
  };

  // Reorder Rules
  const addReorderRule = (rule: Omit<ReorderingRule, 'id'>) => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Only Inventory Managers can configure reordering rules.');
    }
    const newRule: ReorderingRule = {
      ...rule,
      id: `rule-${Date.now().toString().slice(-4)}`,
    };
    setReorderRules((prev) => [newRule, ...prev]);
  };

  const updateReorderRule = (id: string, updates: Partial<ReorderingRule>) => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Only Inventory Managers can configure reordering rules.');
    }
    setReorderRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteReorderRule = (id: string) => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Only Inventory Managers can configure reordering rules.');
    }
    setReorderRules((prev) => prev.filter((r) => r.id !== id));
  };

  // Warehouses & Locations
  const addWarehouse = (data: { name: string; code: string; address: string }): Warehouse => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Only Inventory Managers can configure warehouses.');
    }
    const newWh: Warehouse = {
      id: `wh-${Date.now().toString().slice(-4)}`,
      name: data.name,
      code: data.code.toUpperCase(),
      address: data.address,
      locations: [
        {
          id: `loc-${Date.now()}-1`,
          name: 'Main Receiving Dock',
          code: 'REC-01',
          warehouseId: `wh-${Date.now().toString().slice(-4)}`,
          type: 'receiving',
          capacity: 2000,
        },
        {
          id: `loc-${Date.now()}-2`,
          name: 'Central Racks',
          code: 'RACK-01',
          warehouseId: `wh-${Date.now().toString().slice(-4)}`,
          type: 'rack',
          capacity: 8000,
        },
      ],
    };
    setWarehouses((prev) => [...prev, newWh]);
    return newWh;
  };

  const addLocation = (data: {
    warehouseId: string;
    name: string;
    code: string;
    type: 'rack' | 'receiving' | 'staging' | 'floor' | 'shipping';
    capacity?: number;
  }) => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Only Inventory Managers can configure warehouse locations.');
    }
    const newLoc = {
      id: `loc-${Date.now()}`,
      name: data.name,
      code: data.code.toUpperCase(),
      warehouseId: data.warehouseId,
      type: data.type,
      capacity: data.capacity || 5000,
    };

    setWarehouses((prev) =>
      prev.map((wh) => (wh.id === data.warehouseId ? { ...wh, locations: [...wh.locations, newLoc] } : wh))
    );
  };

  // =========================================================================
  // PENDING APPROVALS QUEUE (FOR MANAGER DASHBOARD)
  // =========================================================================
  const pendingApprovals: PendingApprovalItem[] = useMemo(() => {
    const items: PendingApprovalItem[] = [];

    // 1. Receipts awaiting approval
    receipts
      .filter((r) => r.status === 'awaiting_approval' || r.status === 'waiting')
      .forEach((r) => {
        const firstItem = r.items[0];
        items.push({
          id: r.id,
          operationType: 'Receipt',
          documentId: r.receiptNumber,
          staffMember: r.submittedBy || 'Marcus Miller',
          warehouse: r.destinationLocationName.split('→')[0].trim() || 'Main Central Hub',
          warehouseId: r.destinationWarehouseId,
          quantity: firstItem ? `${firstItem.quantityReceived || firstItem.quantityExpected} ${firstItem.unitOfMeasure}` : '100 units',
          timestamp: r.submittedAt || r.createdAt,
          status: 'AWAITING APPROVAL',
          details: `${r.supplierName} • Location: ${r.destinationLocationName}`,
          rawOperation: r,
        });
      });

    // 2. Deliveries awaiting approval
    deliveries
      .filter((d) => d.status === 'awaiting_approval')
      .forEach((d) => {
        const firstItem = d.items[0];
        items.push({
          id: d.id,
          operationType: 'Delivery',
          documentId: d.deliveryNumber,
          staffMember: d.submittedBy || 'Marcus Miller',
          warehouse: d.sourceLocationName.split('→')[0].trim() || 'Main Central Hub',
          warehouseId: d.sourceWarehouseId,
          quantity: firstItem ? `${firstItem.quantityPacked || firstItem.quantityRequested} ${firstItem.unitOfMeasure}` : '10 units',
          timestamp: d.submittedAt || d.createdAt,
          status: 'AWAITING APPROVAL',
          details: `${d.customerName} • Picked: ${firstItem?.quantityPicked || 10}, Packed: ${firstItem?.quantityPacked || 10}`,
          rawOperation: d,
        });
      });

    // 3. Transfers awaiting approval
    transfers
      .filter((t) => t.status === 'awaiting_approval')
      .forEach((t) => {
        const firstItem = t.items[0];
        items.push({
          id: t.id,
          operationType: 'Internal Transfer',
          documentId: t.transferNumber,
          staffMember: t.submittedBy || 'Marcus Miller',
          warehouse: t.sourceLocationName.split('[')[0].trim() || 'Main Central Hub',
          warehouseId: t.sourceWarehouseId,
          quantity: firstItem ? `${firstItem.quantity} ${firstItem.unitOfMeasure}` : '25 units',
          timestamp: t.submittedAt || t.scheduledDate,
          status: 'AWAITING APPROVAL',
          details: `${t.sourceLocationName} → ${t.destinationLocationName}`,
          rawOperation: t,
        });
      });

    // 4. Adjustments awaiting approval
    adjustments
      .filter((a) => a.status === 'awaiting_approval' || a.status === 'waiting')
      .forEach((a) => {
        const firstItem = a.items[0];
        const diffStr = firstItem ? `${firstItem.difference > 0 ? '+' : ''}${firstItem.difference} ${firstItem.unitOfMeasure}` : '-3 units';
        items.push({
          id: a.id,
          operationType: 'Adjustment',
          documentId: a.adjustmentNumber,
          staffMember: a.submittedBy || a.createdByName || 'Marcus Miller',
          warehouse: a.warehouseName || 'Main Central Hub',
          warehouseId: a.warehouseId,
          quantity: diffStr,
          timestamp: a.submittedAt || a.createdAt,
          status: 'AWAITING APPROVAL',
          details: firstItem
            ? `${firstItem.productName} • System: ${firstItem.recordedQuantity}, Count: ${firstItem.physicalQuantity}, Diff: ${firstItem.difference} (${a.reason})`
            : `Physical count adjustment (${a.reason})`,
          rawOperation: a,
        });
      });

    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [receipts, deliveries, transfers, adjustments]);

  // Global KPIs
  const kpis = useMemo(() => {
    let totalUnits = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      const stock = (p.locationStock || []).reduce((acc, curr) => acc + (curr.quantity || 0), 0);
      totalUnits += stock;
      if (stock === 0) {
        outOfStock++;
        lowStock++;
      } else if (stock <= p.reorderPoint) {
        lowStock++;
      }
    });

    const pendingReceipts = receipts.filter((r) => r.status === 'ready' || r.status === 'in_progress').length;
    const pendingDeliveries = deliveries.filter((d) => d.status === 'ready' || d.status === 'in_progress').length;
    const scheduledTransfers = transfers.filter((t) => t.status === 'ready' || t.status === 'in_progress').length;

    return {
      totalUnitsInStock: totalUnits,
      totalUniqueProducts: products.length,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      pendingReceiptsCount: pendingReceipts,
      pendingDeliveriesCount: pendingDeliveries,
      scheduledTransfersCount: scheduledTransfers,
      pendingApprovalsCount: pendingApprovals.length,
    };
  }, [products, receipts, deliveries, transfers, pendingApprovals]);

  // Low Stock Alerts
  const lowStockAlerts = useMemo(() => {
    const alerts: {
      product: Product;
      currentStock: number;
      reorderPoint: number;
      suggestedOrderQty: number;
      isOutOfStock: boolean;
    }[] = [];

    products.forEach((prod) => {
      const currentStock = getTotalStockForProduct(prod);
      if (currentStock <= prod.reorderPoint) {
        const rule = reorderRules.find((r) => r.productId === prod.id);
        const suggested = rule ? rule.reorderQuantity : Math.max(10, prod.maxStock - currentStock);
        alerts.push({
          product: prod,
          currentStock,
          reorderPoint: prod.reorderPoint,
          suggestedOrderQty: suggested,
          isOutOfStock: currentStock === 0,
        });
      }
    });

    return alerts;
  }, [products, reorderRules]);

  // Role-Based Scoped Data
  const isStaff = currentUser.role === 'warehouse_staff';
  const staffWhId = currentUser.warehouseId || 'wh-main';

  const scopedReceipts = useMemo(() => {
    if (!isStaff) return receipts;
    return receipts.filter((r) => r.destinationWarehouseId === staffWhId);
  }, [receipts, isStaff, staffWhId]);

  const scopedDeliveries = useMemo(() => {
    if (!isStaff) return deliveries;
    return deliveries.filter((d) => d.sourceWarehouseId === staffWhId);
  }, [deliveries, isStaff, staffWhId]);

  const scopedTransfers = useMemo(() => {
    if (!isStaff) return transfers;
    return transfers.filter(
      (t) => t.sourceWarehouseId === staffWhId || t.destinationWarehouseId === staffWhId
    );
  }, [transfers, isStaff, staffWhId]);

  const scopedAdjustments = useMemo(() => {
    if (!isStaff) return adjustments;
    return adjustments.filter((a) => a.warehouseId === staffWhId);
  }, [adjustments, isStaff, staffWhId]);

  const scopedLedger = useMemo(() => {
    if (!isStaff) return ledger;
    const targetWh = warehouses.find((w) => w.id === staffWhId);
    const whName = targetWh?.name || 'Main Central Hub';
    return ledger.filter(
      (l) =>
        l.sourceLocationName.includes(whName) ||
        l.destinationLocationName.includes(whName) ||
        l.sourceLocationName.includes('REC-') ||
        l.sourceLocationName.includes('RACK-A') ||
        l.sourceLocationName.includes('RACK-B')
    );
  }, [ledger, isStaff, staffWhId, warehouses]);

  const scopedKpis = useMemo(() => {
    if (!isStaff) {
      return {
        ...kpis,
        pendingApprovalsCount: pendingApprovals.length,
      };
    }

    let totalUnits = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      const whStock = (p.locationStock || [])
        .filter((ls) => ls.warehouseId === staffWhId)
        .reduce((acc, curr) => acc + (curr.quantity || 0), 0);
      totalUnits += whStock;
      if (whStock === 0) {
        outOfStock++;
        lowStock++;
      } else if (whStock <= p.reorderPoint) {
        lowStock++;
      }
    });

    const pendingReceipts = scopedReceipts.filter((r) => r.status === 'ready' || r.status === 'in_progress').length;
    const pendingDeliveries = scopedDeliveries.filter((d) => d.status === 'ready' || d.status === 'in_progress').length;
    const scheduledTransfers = scopedTransfers.filter((t) => t.status === 'ready' || t.status === 'in_progress').length;
    const pendingCountingTasks = scopedAdjustments.filter((a) => a.status === 'ready' || a.status === 'in_progress').length;

    return {
      totalUnitsInStock: totalUnits,
      totalUniqueProducts: products.length,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      pendingReceiptsCount: pendingReceipts,
      pendingDeliveriesCount: pendingDeliveries,
      scheduledTransfersCount: scheduledTransfers,
      pendingApprovalsCount: pendingCountingTasks,
    };
  }, [isStaff, staffWhId, kpis, products, scopedReceipts, scopedDeliveries, scopedTransfers, scopedAdjustments, pendingApprovals]);

  const scopedLowStockAlerts = useMemo(() => {
    if (!isStaff) return lowStockAlerts;
    const alerts: {
      product: Product;
      currentStock: number;
      reorderPoint: number;
      suggestedOrderQty: number;
      isOutOfStock: boolean;
    }[] = [];

    products.forEach((prod) => {
      const whStock = (prod.locationStock || [])
        .filter((ls) => ls.warehouseId === staffWhId)
        .reduce((acc, curr) => acc + (curr.quantity || 0), 0);
      if (whStock <= prod.reorderPoint) {
        const rule = reorderRules.find((r) => r.productId === prod.id && (r.warehouseId === staffWhId || !r.warehouseId));
        const suggested = rule ? rule.reorderQuantity : Math.max(10, prod.maxStock - whStock);
        alerts.push({
          product: prod,
          currentStock: whStock,
          reorderPoint: prod.reorderPoint,
          suggestedOrderQty: suggested,
          isOutOfStock: whStock === 0,
        });
      }
    });

    return alerts;
  }, [isStaff, staffWhId, lowStockAlerts, products, reorderRules]);

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(INITIAL_USER);
    setProducts(INITIAL_PRODUCTS);
    setWarehouses(INITIAL_WAREHOUSES);
    setCategories(INITIAL_CATEGORIES);
    setReceipts(INITIAL_RECEIPTS);
    setDeliveries(INITIAL_DELIVERIES);
    setTransfers(INITIAL_TRANSFERS);
    setAdjustments(INITIAL_ADJUSTMENTS);
    setLedger(INITIAL_LEDGER);
    setStaffActivity(INITIAL_STAFF_ACTIVITY);
    setReorderRules(INITIAL_REORDER_RULES);
  };

  return (
    <InventoryContext.Provider
      value={{
        currentUser,
        switchUserRole,
        updateCurrentUser,
        products,
        warehouses,
        categories,
        reorderRules,
        receipts,
        deliveries,
        transfers,
        adjustments,
        ledger,
        staffActivity,
        pendingApprovals,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        getTotalStockForProduct,
        getAvailableStockForProduct,
        createReceipt,
        confirmPhysicalIntake,
        approveReceipt,
        rejectReceipt,
        validateReceipt,
        cancelReceipt,
        createDelivery,
        startPicking,
        confirmPacking,
        submitDelivery,
        approveDelivery,
        rejectDelivery,
        advanceDeliveryStage,
        cancelDelivery,
        createInternalTransfer,
        reportTransferComplete,
        approveTransfer,
        rejectTransfer,
        validateTransfer,
        cancelTransfer,
        createStockAdjustment,
        submitStockCount,
        approveAdjustment,
        rejectAdjustment,
        validateStockAdjustment,
        approvePendingOperation,
        rejectPendingOperation,
        addReorderRule,
        updateReorderRule,
        deleteReorderRule,
        addWarehouse,
        addLocation,
        kpis,
        lowStockAlerts,
        scopedReceipts,
        scopedDeliveries,
        scopedTransfers,
        scopedAdjustments,
        scopedLedger,
        scopedKpis,
        scopedLowStockAlerts,
        resetAllData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
