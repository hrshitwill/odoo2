'use client';

import React, { useState } from 'react';
import {
  Bell,
  Warehouse,
  RotateCcw,
  Plus,
  ChevronDown,
  Scan,
  CircleCheck,
  TriangleAlert,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { NavigationTab } from './AppSidebar';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  onNavigate: (tab: NavigationTab) => void;
  selectedWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
  onOpenQuickAction: () => void;
  onOpenScanner?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onNavigate,
  selectedWarehouseId,
  onSelectWarehouse,
  onOpenQuickAction,
  onOpenScanner,
}) => {
  const { warehouses, lowStockAlerts, scopedLowStockAlerts, currentUser, resetAllData } = useInventory();
  const [showNotifications, setShowNotifications] = useState(false);

  const isStaff = currentUser.role === 'warehouse_staff';
  const activeAlerts = isStaff ? scopedLowStockAlerts : lowStockAlerts;
  const staffWarehouse = warehouses.find((w) => w.id === currentUser.warehouseId) || warehouses[0];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 select-none z-20">
      {/* Left: Warehouse Selector & Status */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <Warehouse className="w-[18px] h-[18px] text-slate-500" strokeWidth={1.75} />
          {isStaff ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>{currentUser.assignedWarehouseName || staffWarehouse?.name || 'Main Central Hub'}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold bg-slate-200/80 px-1.5 py-0.5 rounded font-mono">
                Assigned
              </span>
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedWarehouseId}
                onChange={(e) => onSelectWarehouse(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded py-1.5 pl-3 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                <option value="all">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} [{wh.code}]
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.75} />
            </div>
          )}
        </div>

        <div className="hidden lg:flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600 font-sans tracking-wide">
          Operational
        </div>
      </div>

      {/* Right: Actions, Scanner, Alerts */}
      <div className="flex items-center gap-2.5">
        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
          >
            <Scan className="w-4 h-4 text-orange-600" strokeWidth={1.75} />
            <span className="hidden sm:inline">Scanner</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (confirm('Reset StockSense to initial seed demo data?')) {
              resetAllData();
            }
          }}
          title="Reset database to default seed state"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          <span>Reset</span>
        </button>

        {/* Low Stock Alerts */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
            aria-label="Stock Alert Notifications"
          >
            <Bell className="w-4 h-4" strokeWidth={1.75} />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-rose-600 text-white text-[10px] font-mono font-medium flex items-center justify-center px-1">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 font-sans">
                  Stock Alerts ({activeAlerts.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  {isStaff ? 'Facility Scope' : 'Reorder Rules'}
                </span>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  All inventory items above reorder thresholds.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {activeAlerts.map((alert) => (
                    <div
                      key={alert.product.id}
                      className={cn(
                        'p-2.5 rounded border text-xs',
                        alert.isOutOfStock
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      )}
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span className="truncate">{alert.product.name}</span>
                        <span className="font-mono text-[11px] px-1 rounded bg-white/80 border border-slate-200">
                          {alert.product.sku}
                        </span>
                      </div>
                      <div className="text-[11px] mt-1 flex items-center justify-between text-slate-600">
                        <span>Current: {alert.currentStock} {alert.product.unitOfMeasure}</span>
                        <span>Min: {alert.reorderPoint}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotifications(false);
                          onNavigate('receipts');
                        }}
                        className="mt-2 w-full py-1 text-center bg-white text-slate-900 border border-slate-300 rounded text-[11px] font-medium hover:bg-slate-50"
                      >
                        + Create Receipt (Restock {alert.suggestedOrderQty})
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onOpenQuickAction}
          className="btn-primary py-1.5 px-3 text-xs"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          <span>New Operation</span>
        </button>
      </div>
    </header>
  );
};
