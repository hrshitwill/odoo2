'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  ClipboardPenLine,
  TriangleAlert,
  CircleCheck,
  Clock3,
  ListFilter,
  Plus,
  Scan,
  ArrowRight,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { StockMovementArrow } from '@/components/common/StockMovementArrow';
import { Badge } from '@/components/common/Badge';
import { CalibratedMeter, OperationalHeatmap } from '@/components/common/CapacityMeter';
import { NavigationTab } from '@/components/layout/AppSidebar';
import { formatNumber, formatDateTime, formatTime } from '@/lib/utils';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
  selectedWarehouseId: string;
  onOpenScanner?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  selectedWarehouseId,
  onOpenScanner,
}) => {
  const {
    currentUser,
    kpis,
    lowStockAlerts,
    ledger,
    receipts,
    deliveries,
    transfers,
    warehouses,
    categories,
    products,
  } = useInventory();

  const [filterDocType, setFilterDocType] = useState<string>('all');

  const recentMovements = useMemo(() => {
    return ledger.slice(0, 8);
  }, [ledger]);

  const attentionItems = useMemo(() => {
    return lowStockAlerts.slice(0, 4);
  }, [lowStockAlerts]);

  return (
    <div className="space-y-7 pb-16 font-body">
      {/* 1. Header Section */}
      <div className="border-b border-slate-200 pb-5 pt-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-metadata">
              <span className="uppercase tracking-wider font-semibold">Warehouse Operations</span>
              <span className="text-slate-300">/</span>
              <span>26 September 2026</span>
            </div>
            <h1 className="text-page-title">
              Good morning, {currentUser.name}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Inventory is currently stable. <strong className="font-semibold text-slate-900">{kpis.lowStockCount} items</strong> require procurement or transfer attention.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700">
              Role: <strong className="font-semibold text-slate-900">{currentUser.role === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff'}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Nominal
            </span>
          </div>
        </div>
      </div>

      {/* 2. Primary KPI Display (Space Grotesk for numbers, IBM Plex Sans for metadata) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
        {/* KPI 1: Total Units */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white p-5 hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5 flex items-center justify-between">
            <span>Total Stock</span>
            <Package className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" strokeWidth={1.75} />
          </div>
          <div className="text-kpi-number">
            {formatNumber(kpis.totalUnitsInStock)}
          </div>
          <div className="text-metadata text-slate-500 mt-1.5">
            Across {kpis.totalUniqueProducts} active products
          </div>
        </div>

        {/* KPI 2: Low / Out of Stock */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white p-5 hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="text-[11px] uppercase tracking-wider text-amber-700 font-medium mb-1.5 flex items-center justify-between">
            <span>Low / Out</span>
            <TriangleAlert className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
          </div>
          <div className="text-kpi-number text-amber-600">
            {kpis.lowStockCount < 10 ? `0${kpis.lowStockCount}` : kpis.lowStockCount}
          </div>
          <div className="text-metadata text-amber-700 mt-1.5">
            {kpis.outOfStockCount} out of stock
          </div>
        </div>

        {/* KPI 3: Inbound Receipts */}
        <div
          onClick={() => onNavigate('receipts')}
          className="bg-white p-5 hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5 flex items-center justify-between">
            <span>Receiving</span>
            <ArrowDownToLine className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" strokeWidth={1.75} />
          </div>
          <div className="text-kpi-number">
            {kpis.pendingReceiptsCount < 10 ? `0${kpis.pendingReceiptsCount}` : kpis.pendingReceiptsCount}
          </div>
          <div className="text-metadata text-slate-500 mt-1.5">
            Pending arrival
          </div>
        </div>

        {/* KPI 4: Pending Deliveries */}
        <div
          onClick={() => onNavigate('delivery_orders')}
          className="bg-white p-5 hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5 flex items-center justify-between">
            <span>Deliveries</span>
            <ArrowUpFromLine className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" strokeWidth={1.75} />
          </div>
          <div className="text-kpi-number">
            {kpis.pendingDeliveriesCount < 10 ? `0${kpis.pendingDeliveriesCount}` : kpis.pendingDeliveriesCount}
          </div>
          <div className="text-metadata text-slate-500 mt-1.5">
            Pending orders
          </div>
        </div>

        {/* KPI 5: Internal Transfers */}
        <div
          onClick={() => onNavigate('internal_transfers')}
          className="bg-white p-5 hover:bg-slate-50 transition-colors cursor-pointer group col-span-2 md:col-span-1"
        >
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5 flex items-center justify-between">
            <span>Transfers</span>
            <ArrowRightLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" strokeWidth={1.75} />
          </div>
          <div className="text-kpi-number">
            {kpis.scheduledTransfersCount < 10 ? `0${kpis.scheduledTransfersCount}` : kpis.scheduledTransfersCount}
          </div>
          <div className="text-metadata text-slate-500 mt-1.5">
            Scheduled moves
          </div>
        </div>
      </div>

      {/* 3. Capacity & Telemetry Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-metadata text-slate-500 uppercase tracking-wider">
              Warehouse Capacity
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-kpi-number">
                88%
              </span>
              <span className="inline-flex items-center text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CircleCheck className="w-3.5 h-3.5 mr-1" strokeWidth={1.75} /> Optimal
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm pt-0.5">
              Racking areas A &amp; B storage density within normal parameters.
            </p>
          </div>

          <div className="pl-5 border-l border-slate-100 flex items-center">
            <CalibratedMeter percentage={88} />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-metadata text-slate-500 uppercase tracking-wider">
              Fulfilment Center Capacity
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-kpi-number">
                24%
              </span>
              <span className="inline-flex items-center text-xs font-medium text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                Ready for Dispatch
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm pt-0.5">
              Orders cleared for morning dispatch. Next scheduled pickup window at 14:00.
            </p>
          </div>

          <div className="pl-5 border-l border-slate-100 flex items-center">
            <CalibratedMeter percentage={24} />
          </div>
        </div>
      </div>

      {/* 4. Facility Telemetry Matrix */}
      <OperationalHeatmap title="Supplier Capacity &amp; Warehouse Load" />

      {/* 5. Movement Feed & Attention Required */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Movement */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div>
              <div className="text-metadata uppercase tracking-wider text-slate-400">
                Movement Log
              </div>
              <h2 className="text-section-heading">
                Today&apos;s Movement
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('move_history')}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              View Stock Ledger &rarr;
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            <div className="flex items-center gap-1 text-xs text-slate-500 mr-2">
              <ListFilter className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              <span>Filter:</span>
            </div>
            {['all', 'Receipt', 'Delivery', 'Internal Transfer', 'Adjustment'].map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setFilterDocType(op)}
                className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                  filterDocType === op
                    ? 'bg-slate-900 text-white border-slate-900 font-medium'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {op === 'all' ? 'All Moves' : op}
              </button>
            ))}
          </div>

          {/* Movements List with Directional Visual Flow */}
          <div className="space-y-2.5">
            {recentMovements
              .filter((m) => filterDocType === 'all' || m.operationType === filterDocType)
              .map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {/* Operation Icon: 16px, consistent stroke width, neutral visual weight */}
                      {item.operationType === 'Receipt' && (
                        <ArrowDownToLine className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.75} />
                      )}
                      {item.operationType === 'Delivery' && (
                        <ArrowUpFromLine className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.75} />
                      )}
                      {item.operationType === 'Internal Transfer' && (
                        <ArrowRightLeft className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.75} />
                      )}
                      {item.operationType === 'Adjustment' && (
                        <ClipboardPenLine className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.75} />
                      )}

                      <span className="text-slate-400 text-[11px] font-mono">
                        {formatTime(item.timestamp)}
                      </span>
                      <span className="font-semibold text-slate-900">{item.productName}</span>
                      <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200">
                        {item.sku}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Plain text badge: no circular dots, subtle semantic text colors */}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded border ${
                          item.operationType === 'Receipt'
                            ? 'bg-slate-50 text-emerald-700 border-slate-200'
                            : item.operationType === 'Internal Transfer'
                            ? 'bg-slate-50 text-slate-700 border-slate-200'
                            : item.operationType === 'Delivery'
                            ? 'bg-slate-50 text-orange-700 border-slate-200'
                            : 'bg-slate-50 text-amber-700 border-slate-200'
                        }`}
                      >
                        {item.operationType === 'Internal Transfer' ? 'Transfer' : item.operationType}
                      </span>

                      <span
                        className={`font-mono font-semibold text-xs ${
                          item.quantityDelta > 0
                            ? 'text-emerald-700'
                            : item.quantityDelta < 0
                            ? 'text-orange-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {item.quantityDelta > 0 ? `+${item.quantityDelta}` : item.quantityDelta === 0 ? `Transfer` : item.quantityDelta} {item.unitOfMeasure}
                      </span>
                    </div>
                  </div>

                  <StockMovementArrow
                    source={item.sourceLocationName}
                    destination={item.destinationLocationName}
                    compact={true}
                    className="bg-slate-50/70 p-2 rounded border border-slate-100 w-full"
                  />
                </div>
              ))}
          </div>
        </div>

        {/* Right 1 Col: Attention Required */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div>
              <div className="text-metadata uppercase tracking-wider text-amber-700">
                Action Items
              </div>
              <h2 className="text-section-heading">
                Attention Required
              </h2>
            </div>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {attentionItems.length} Items
            </span>
          </div>

          <div className="space-y-3">
            {attentionItems.length === 0 ? (
              <div className="p-6 bg-white border border-slate-200 rounded-lg text-center">
                <CircleCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" strokeWidth={1.75} />
                <p className="text-xs text-slate-500">
                  All inventory items are currently above reorder points.
                </p>
              </div>
            ) : (
              attentionItems.map((item) => (
                <div
                  key={item.product.id}
                  className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">{item.product.name}</h4>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {item.product.sku} · {item.product.category}
                      </div>
                    </div>
                    <Badge variant={item.isOutOfStock ? 'danger' : 'warning'} size="sm">
                      {item.isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                    </Badge>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Stock:</span>
                      <strong className={`font-mono ${item.isOutOfStock ? 'text-rose-600' : 'text-amber-700'}`}>
                        {item.currentStock} {item.product.unitOfMeasure}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reorder Point:</span>
                      <strong className="font-mono text-slate-800">
                        {item.reorderPoint} {item.product.unitOfMeasure}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600 border-t border-slate-200/60 pt-1">
                      <span>Suggested PO:</span>
                      <span className="font-mono font-semibold text-orange-600">
                        +{item.suggestedOrderQty} {item.product.unitOfMeasure}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onNavigate('receipts')}
                      className="flex-1 py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors text-center"
                    >
                      + Create Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('products')}
                      className="py-1.5 px-2.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded text-xs transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {onOpenScanner && (
            <div className="p-4 bg-slate-900 text-white rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-orange-400 font-medium flex items-center gap-1.5">
                  <Scan className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Barcode Scanner
                </span>
                <span className="text-[11px] text-slate-400">Ready</span>
              </div>
              <p className="text-xs text-slate-300 leading-normal">
                Scan pallet tags or article barcodes to verify stock and locations.
              </p>
              <button
                type="button"
                onClick={onOpenScanner}
                className="w-full py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Scanner</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
