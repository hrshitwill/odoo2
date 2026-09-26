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

  // Actions - Receipts
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
  validateReceipt: (receiptId: string) => boolean;
  cancelReceipt: (receiptId: string) => void;

  // Actions - Deliveries
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
  advanceDeliveryStage: (deliveryId: string, nextStage?: DeliveryStage) => boolean;
  cancelDelivery: (deliveryId: string) => void;

  // Actions - Internal Transfers
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
  validateTransfer: (transferId: string) => boolean;
  cancelTransfer: (transferId: string) => void;

  // Actions - Stock Adjustments
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
  validateStockAdjustment: (adjustmentId: string) => boolean;

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

const STORAGE_KEY = 'stocksense_ims_state_v1';

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
        if (parsed.reorderRules) setReorderRules(parsed.reorderRules);
        if (parsed.currentUser && !auth?.user) setCurrentUser(parsed.currentUser);
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }
    setIsHydrated(true);
  }, [auth?.user]);

  // Save to localStorage whenever state changes after hydration
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
          reorderRules,
        })
      );
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
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
    reorderRules,
  ]);

  const switchUserRole = (role: 'inventory_manager' | 'warehouse_staff') => {
    const targetUser = role === 'inventory_manager' ? INITIAL_USER : SECONDARY_USER;
    setCurrentUser(targetUser);
    if (auth?.quickLoginAs) {
      auth.quickLoginAs(role);
    }
  };

  const updateCurrentUser = (userData: Partial<User>) => {
    setCurrentUser((prev) => ({ ...prev, ...userData }));
  };

  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  const getTotalStockForProduct = (product: Product): number => {
    return (product.locationStock || []).reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  };

  const getAvailableStockForProduct = (product: Product): number => {
    return (product.locationStock || []).reduce(
      (acc, curr) => acc + Math.max(0, (curr.quantity || 0) - (curr.reserved || 0)),
      0
    );
  };

  // Add Product
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
      throw new Error('403 Forbidden: Only Inventory Managers can create or register master products.');
    }
    const newId = `prod-${Date.now().toString().slice(-5)}`;
    let initialLocationStock = [];

    const targetWarehouse = warehouses.find((w) => w.id === data.initialWarehouseId) || warehouses[0];
    const targetLocation =
      targetWarehouse?.locations.find((l) => l.id === data.initialLocationId) || targetWarehouse?.locations[0];

    if (data.initialStock && data.initialStock > 0 && targetLocation && targetWarehouse) {
      initialLocationStock.push({
        locationId: targetLocation.id,
        locationName: targetLocation.name,
        warehouseId: targetWarehouse.id,
        warehouseName: targetWarehouse.name,
        quantity: data.initialStock,
        reserved: 0,
      });

      // Log to Ledger
      const newLedgerEntry: StockLedgerEntry = {
        id: `led-${Date.now()}`,
        timestamp: new Date().toISOString(),
        productId: newId,
        productName: data.name,
        sku: data.sku,
        operationType: 'Initial Stock',
        referenceNumber: 'INIT-SETUP',
        sourceLocationName: 'System Setup / Opening Balance',
        destinationLocationName: `${targetWarehouse.name} [${targetLocation.name}]`,
        quantityDelta: data.initialStock,
        unitOfMeasure: data.unitOfMeasure,
        resultingTotalStock: data.initialStock,
        userName: currentUser.name,
        status: 'Completed',
        notes: 'Initial inventory onboarded into system.',
      };
      setLedger((prev) => [newLedgerEntry, ...prev]);
    }

    const newProduct: Product = {
      id: newId,
      name: data.name,
      sku: data.sku.toUpperCase(),
      barcode: `890100${Math.floor(100000 + Math.random() * 900000)}`,
      category: data.category,
      unitOfMeasure: data.unitOfMeasure,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      reorderPoint: data.reorderPoint,
      maxStock: data.maxStock,
      description: data.description || '',
      supplierName: data.supplierName || 'General Sourcing Corp',
      locationStock: initialLocationStock,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Also auto-create a reordering rule
    if (data.reorderPoint > 0) {
      const newRule: ReorderingRule = {
        id: `rule-${Date.now().toString().slice(-4)}`,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        warehouseId: targetWarehouse ? targetWarehouse.id : warehouses[0].id,
        warehouseName: targetWarehouse ? targetWarehouse.name : warehouses[0].name,
        minStock: data.reorderPoint,
        maxStock: data.maxStock || data.reorderPoint * 4,
        reorderQuantity: (data.maxStock || data.reorderPoint * 4) - data.reorderPoint,
        unitOfMeasure: data.unitOfMeasure,
        isActive: true,
        leadTimeDays: 5,
        supplierName: data.supplierName || 'Default Vendor',
      };
      setReorderRules((prev) => [newRule, ...prev]);
    }

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Only Inventory Managers can modify product master data.');
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

  // Receipts
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

  const validateReceipt = (receiptId: string): boolean => {
    const receipt = receipts.find((r) => r.id === receiptId);
    if (!receipt || receipt.status === 'done' || receipt.status === 'cancelled') return false;

    // Increase stock for each item in destination location
    setProducts((prevProducts) => {
      return prevProducts.map((product) => {
        const receiptItem = receipt.items.find((item) => item.productId === product.id);
        if (!receiptItem) return product;

        const qtyToAdd = receiptItem.quantityReceived || receiptItem.quantityExpected;
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
            locationName: loc ? loc.name : 'Racking Area',
            warehouseId: receipt.destinationWarehouseId,
            warehouseName: wh ? wh.name : 'Main Hub',
            quantity: qtyToAdd,
            reserved: 0,
          });
        }

        return {
          ...product,
          locationStock: currentLocStocks,
          updatedAt: new Date().toISOString(),
        };
      });
    });

    // Mark Receipt Done
    const nowIso = new Date().toISOString();
    setReceipts((prev) =>
      prev.map((r) => (r.id === receiptId ? { ...r, status: 'done', validatedAt: nowIso } : r))
    );

    // Append to Stock Ledger
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
        notes: receipt.notes || 'Inbound goods receipt validated.',
      };

      setLedger((prev) => [ledgerEntry, ...prev]);
    });

    return true;
  };

  const cancelReceipt = (receiptId: string) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === receiptId ? { ...r, status: 'cancelled' } : r))
    );
  };

  // Deliveries
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

  const advanceDeliveryStage = (deliveryId: string, nextStage?: DeliveryStage): boolean => {
    const order = deliveries.find((d) => d.id === deliveryId);
    if (!order || order.status === 'done' || order.status === 'cancelled') return false;

    let targetStage: DeliveryStage = nextStage || 'pick';
    if (!nextStage) {
      if (order.stage === 'draft' || order.stage === 'pick') targetStage = 'pack';
      else if (order.stage === 'pack') targetStage = 'validate';
      else if (order.stage === 'validate') targetStage = 'done';
    }

    if (targetStage === 'pack') {
      // Pick all items fully
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === deliveryId
            ? {
                ...d,
                stage: 'pack',
                items: d.items.map((item) => ({ ...item, quantityPicked: item.quantityRequested })),
              }
            : d
        )
      );
      return true;
    }

    if (targetStage === 'validate') {
      // Pack all items fully
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === deliveryId
            ? {
                ...d,
                stage: 'validate',
                items: d.items.map((item) => ({ ...item, quantityPacked: item.quantityRequested })),
              }
            : d
        )
      );
      return true;
    }

    if (targetStage === 'done') {
      // Deduct stock from the source location
      const nowIso = new Date().toISOString();

      setProducts((prevProducts) => {
        return prevProducts.map((product) => {
          const itemToDeliver = order.items.find((i) => i.productId === product.id);
          if (!itemToDeliver) return product;

          const qtyToDeduct = itemToDeliver.quantityRequested;
          const currentLocStocks = [...(product.locationStock || [])];
          const existingLocIndex = currentLocStocks.findIndex(
            (ls) => ls.locationId === order.sourceLocationId
          );

          if (existingLocIndex >= 0) {
            currentLocStocks[existingLocIndex] = {
              ...currentLocStocks[existingLocIndex],
              quantity: Math.max(0, currentLocStocks[existingLocIndex].quantity - qtyToDeduct),
              reserved: Math.max(0, (currentLocStocks[existingLocIndex].reserved || 0) - qtyToDeduct),
            };
          }

          return {
            ...product,
            locationStock: currentLocStocks,
            updatedAt: nowIso,
          };
        });
      });

      // Update delivery order status
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === deliveryId
            ? {
                ...d,
                stage: 'done',
                status: 'done',
                validatedAt: nowIso,
              }
            : d
        )
      );

      // Add to ledger
      order.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const prevTotal = prod ? getTotalStockForProduct(prod) : 0;

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
          quantityDelta: -item.quantityRequested,
          unitOfMeasure: item.unitOfMeasure,
          resultingTotalStock: Math.max(0, prevTotal - item.quantityRequested),
          userName: currentUser.name,
          status: 'Completed',
          notes: order.notes || 'Goods dispatched to client destination.',
        };
        setLedger((prev) => [ledgerEntry, ...prev]);
      });

      return true;
    }

    return false;
  };

  const cancelDelivery = (deliveryId: string) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, status: 'cancelled', stage: 'cancelled' } : d))
    );
  };

  // Internal Transfers
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

  const validateTransfer = (transferId: string): boolean => {
    const transfer = transfers.find((t) => t.id === transferId);
    if (!transfer || transfer.status === 'done' || transfer.status === 'cancelled') return false;

    const nowIso = new Date().toISOString();

    // Source decreases, Destination increases, Total company stock is unchanged!
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
            warehouseName: destWh ? destWh.name : 'Destination Site',
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

    // Mark transfer done
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status: 'done', completedAt: nowIso } : t))
    );

    // Append to ledger (Delta = 0 company-wide, but location move logged)
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
        notes: `Transferred ${item.quantity} ${item.unitOfMeasure} between facilities.`,
      };

      setLedger((prev) => [ledgerEntry, ...prev]);
    });

    return true;
  };

  const cancelTransfer = (transferId: string) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status: 'cancelled' } : t))
    );
  };

  // Stock Adjustments
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
    const wh = warehouses.find((w) => w.id === data.warehouseId) || warehouses[0];
    const adjustmentNumber = `ADJ-2026-0${42 + adjustments.length}`;
    const nowIso = new Date().toISOString();
    const isStaff = currentUser.role === 'warehouse_staff';
    const status = isStaff ? 'waiting' : 'done';

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
        locationName: loc ? loc.name : 'Racking Slot',
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
      notes: data.notes || (isStaff ? 'Physical count submitted by warehouse floor staff. Awaiting manager approval.' : undefined),
      status,
      createdAt: nowIso,
      createdByName: currentUser.name,
      items: adjustmentItems,
    };

    setAdjustments((prev) => [newAdjustment, ...prev]);

    // If Inventory Manager creates adjustment, update stocks and ledger immediately
    if (!isStaff) {
      setProducts((prevProducts) => {
        return prevProducts.map((product) => {
          const adjItem = adjustmentItems.find((i) => i.productId === product.id);
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
              locationId: adjItem.locationId,
              locationName: adjItem.locationName,
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

      // Append adjustment items to Stock Ledger
      adjustmentItems.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const newTotal = prod ? getTotalStockForProduct(prod) + item.difference : item.physicalQuantity;

        const ledgerEntry: StockLedgerEntry = {
          id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: nowIso,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          operationType: 'Adjustment',
          referenceNumber: adjustmentNumber,
          sourceLocationName: `${wh.name} [${item.locationName}]`,
          destinationLocationName: item.difference >= 0 ? 'Surplus Audit Credit' : 'Scrap / Loss Audit Debit',
          quantityDelta: item.difference,
          unitOfMeasure: item.unitOfMeasure,
          resultingTotalStock: newTotal,
          userName: currentUser.name,
          status: 'Completed',
          notes: `Inventory adjustment [${data.reason}]: count corrected from ${item.recordedQuantity} to ${item.physicalQuantity} (${item.difference >= 0 ? '+' : ''}${item.difference} ${item.unitOfMeasure}).`,
        };

        setLedger((prev) => [ledgerEntry, ...prev]);
      });
    }

    return newAdjustment;
  };

  // Manager Approval Action for Adjustments
  const validateStockAdjustment = (adjustmentId: string): boolean => {
    if (currentUser.role !== 'inventory_manager') {
      throw new Error('403 Forbidden: Only Inventory Managers can approve and validate adjustments.');
    }

    const adj = adjustments.find((a) => a.id === adjustmentId);
    if (!adj || adj.status !== 'waiting') return false;

    const nowIso = new Date().toISOString();
    const wh = warehouses.find((w) => w.id === adj.warehouseId) || warehouses[0];

    // Apply differences to product stocks
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
            locationId: adjItem.locationId,
            locationName: adjItem.locationName,
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

    // Record ledger entries
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
        notes: `Manager approved physical count submitted by ${adj.createdByName}.`,
      };

      setLedger((prev) => [ledgerEntry, ...prev]);
    });

    // Update adjustment status
    setAdjustments((prev) =>
      prev.map((a) =>
        a.id === adjustmentId
          ? {
              ...a,
              status: 'done',
              validatedByName: currentUser.name,
              validatedAt: nowIso,
            }
          : a
      )
    );

    return true;
  };

  // Reorder Rules (Manager Only)
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

  // Warehouses & Locations (Manager Only)
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

  // Calculate dynamic KPIs
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

    const pendingReceipts = receipts.filter((r) => r.status === 'ready' || r.status === 'waiting').length;
    const pendingDeliveries = deliveries.filter((d) => d.status === 'ready' || d.status === 'waiting').length;
    const scheduledTransfers = transfers.filter((t) => t.status === 'ready' || t.status === 'waiting').length;

    return {
      totalUnitsInStock: totalUnits,
      totalUniqueProducts: products.length,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      pendingReceiptsCount: pendingReceipts,
      pendingDeliveriesCount: pendingDeliveries,
      scheduledTransfersCount: scheduledTransfers,
    };
  }, [products, receipts, deliveries, transfers]);

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

  // Role-based scoped data selectors
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
    const pendingApprovals = adjustments.filter((a) => a.status === 'waiting').length;

    if (!isStaff) {
      return {
        ...kpis,
        pendingApprovalsCount: pendingApprovals,
      };
    }

    // Scoped specifically to staff's assigned warehouse
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

    const pendingReceipts = scopedReceipts.filter((r) => r.status === 'ready' || r.status === 'waiting').length;
    const pendingDeliveries = scopedDeliveries.filter((d) => d.status === 'ready' || d.status === 'waiting').length;
    const scheduledTransfers = scopedTransfers.filter((t) => t.status === 'ready' || t.status === 'waiting').length;

    return {
      totalUnitsInStock: totalUnits,
      totalUniqueProducts: products.length,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      pendingReceiptsCount: pendingReceipts,
      pendingDeliveriesCount: pendingDeliveries,
      scheduledTransfersCount: scheduledTransfers,
      pendingApprovalsCount: pendingApprovals,
    };
  }, [isStaff, staffWhId, kpis, products, scopedReceipts, scopedDeliveries, scopedTransfers, adjustments]);

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
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        getTotalStockForProduct,
        getAvailableStockForProduct,
        createReceipt,
        validateReceipt,
        cancelReceipt,
        createDelivery,
        advanceDeliveryStage,
        cancelDelivery,
        createInternalTransfer,
        validateTransfer,
        cancelTransfer,
        createStockAdjustment,
        validateStockAdjustment,
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
