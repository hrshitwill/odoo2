'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useInventory } from '@/context/InventoryContext';
import { NavigationTab } from '@/components/layout/AppSidebar';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  ClipboardPenLine,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  Building2,
  Calendar,
  Layers,
  MapPin,
  ChevronRight
} from 'lucide-react';

interface StaffDashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const StaffDashboardView: React.FC<StaffDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const {
    scopedReceipts,
    scopedDeliveries,
    scopedTransfers,
    scopedAdjustments,
    scopedLowStockAlerts,
    scopedLedger,
    warehouses
  } = useInventory();

  const assignedWarehouse = warehouses.find(w => w.id === user?.warehouseId);
  const warehouseName = user?.assignedWarehouseName || assignedWarehouse?.name || 'Main Central Hub';

  // Compute pending metrics for staff assigned warehouse
  const pendingReceipts = scopedReceipts.filter(r => r.status === 'draft' || r.status === 'waiting' || r.status === 'ready');
  const pendingDeliveries = scopedDeliveries.filter(d => d.status === 'draft' || d.status === 'waiting' || d.status === 'ready');
  const pendingTransfers = scopedTransfers.filter(t => t.status === 'draft' || t.status === 'waiting' || t.status === 'ready');
  const pendingCountingTasks = scopedAdjustments.filter(a => a.status === 'draft' || a.status === 'waiting');

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Staff Operational Welcome Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Warehouse Operations
              </span>
              <span className="text-slate-400 dark:text-slate-500 text-xs">•</span>
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                {warehouseName}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold font-heading text-slate-900 dark:text-white tracking-tight">
              Good Morning, {user?.name ? user.name.split(' ')[0] : 'Marcus'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Active operational queue for your assigned facility. Review your daily intake, dispatch, and physical counting schedule.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="p-2 rounded bg-primary/10 text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Operational Shift</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{todayDateStr}</p>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S WORK - Metrics Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-heading">
            Today&apos;s Work Queue
          </h2>
          <span className="text-xs text-slate-400">Scoped to {warehouseName}</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Receipts Card */}
          <div
            onClick={() => onNavigate('receipts')}
            className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 shadow-sm transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <ArrowDownToLine className="w-5 h-5 text-slate-700 dark:text-slate-300" strokeWidth={1.75} />
              <span className="flex items-center text-xs font-medium text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                Process <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
            <div className="text-3xl font-bold font-heading text-slate-900 dark:text-white mb-1">
              {String(pendingReceipts.length).padStart(2, '0')}
            </div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Receipts
            </div>
            <p className="text-xs text-slate-400 mt-1">Pending inbound delivery verification</p>
          </div>

          {/* Deliveries Card */}
          <div
            onClick={() => onNavigate('delivery_orders')}
            className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 shadow-sm transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <ArrowUpFromLine className="w-5 h-5 text-slate-700 dark:text-slate-300" strokeWidth={1.75} />
              <span className="flex items-center text-xs font-medium text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                Fulfill <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
            <div className="text-3xl font-bold font-heading text-slate-900 dark:text-white mb-1">
              {String(pendingDeliveries.length).padStart(2, '0')}
            </div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Deliveries
            </div>
            <p className="text-xs text-slate-400 mt-1">Awaiting picking &amp; packing</p>
          </div>

          {/* Internal Transfers Card */}
          <div
            onClick={() => onNavigate('internal_transfers')}
            className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 shadow-sm transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <ArrowRightLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" strokeWidth={1.75} />
              <span className="flex items-center text-xs font-medium text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                Execute <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
            <div className="text-3xl font-bold font-heading text-slate-900 dark:text-white mb-1">
              {String(pendingTransfers.length).padStart(2, '0')}
            </div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Transfers
            </div>
            <p className="text-xs text-slate-400 mt-1">Inter-zone stock relocalizations</p>
          </div>

          {/* Counting Tasks Card */}
          <div
            onClick={() => onNavigate('adjustments')}
            className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 shadow-sm transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <ClipboardPenLine className="w-5 h-5 text-slate-700 dark:text-slate-300" strokeWidth={1.75} />
              <span className="flex items-center text-xs font-medium text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                Count <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
            <div className="text-3xl font-bold font-heading text-slate-900 dark:text-white mb-1">
              {String(pendingCountingTasks.length).padStart(2, '0')}
            </div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Counting Tasks
            </div>
            <p className="text-xs text-slate-400 mt-1">Physical audit &amp; cycle counts</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TODAY'S OPERATIONS TIMELINE (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                  Today&apos;s Operations Timeline
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Scheduled physical operations awaiting your direct warehouse floor intervention.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Scheduled Queue
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {/* Operation Item 1: Receive Steel Rods */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start gap-3.5">
                  <ArrowDownToLine className="w-4 h-4 text-slate-500 shrink-0 mt-1" strokeWidth={1.75} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        09:42
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Receive Industrial Steel Rods (100 Units)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Apex Industrial Corp</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <MapPin className="w-3 h-3" /> Receiving Bay A
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('receipts')}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  Confirm Intake
                </button>
              </div>

              {/* Operation Item 2: Transfer Steel Rods */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start gap-3.5">
                  <ArrowRightLeft className="w-4 h-4 text-slate-500 shrink-0 mt-1" strokeWidth={1.75} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        10:15
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Relocate Steel Rods (25 Units)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Receiving Bay A</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                        <MapPin className="w-3 h-3" /> Production Zone B
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('internal_transfers')}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Execute Transfer
                </button>
              </div>

              {/* Operation Item 3: Pick & Pack Chairs */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start gap-3.5">
                  <ArrowUpFromLine className="w-4 h-4 text-slate-500 shrink-0 mt-1" strokeWidth={1.75} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        13:20
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Pick &amp; Pack Ergonomic Mesh Chairs (10 Units)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Rack B-04</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                        <MapPin className="w-3 h-3" /> Outbound Dispatch Bay
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('delivery_orders')}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                  Pick &amp; Pack
                </button>
              </div>

              {/* Operation Item 4: Pending Physical Count */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start gap-3.5">
                  <ClipboardPenLine className="w-4 h-4 text-slate-500 shrink-0 mt-1" strokeWidth={1.75} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        15:00
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Cycle Count: Aluminum Profiles &amp; Fasteners
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Zone A / Shelf 01</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">Physical Audit Task</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('adjustments')}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                >
                  <ClipboardPenLine className="w-3.5 h-3.5" />
                  Perform Count
                </button>
              </div>
            </div>
          </div>

          {/* Recent Warehouse Move Log */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
                Recent Ledger Transactions ({warehouseName})
              </h3>
              <button
                onClick={() => onNavigate('move_history')}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                View Stock Ledger &rarr;
              </button>
            </div>
            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60">
              {scopedLedger.slice(0, 4).map((entry) => (
                <div key={entry.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-slate-400 text-[11px]">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {entry.productName}
                      </span>
                      <span className="text-slate-400 ml-1.5 font-mono text-[11px]">
                        ({entry.referenceNumber})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded border ${
                        entry.operationType === 'Receipt'
                          ? 'bg-slate-50 text-emerald-700 border-slate-200'
                          : entry.operationType === 'Internal Transfer'
                          ? 'bg-slate-50 text-slate-700 border-slate-200'
                          : entry.operationType === 'Delivery'
                          ? 'bg-slate-50 text-orange-700 border-slate-200'
                          : 'bg-slate-50 text-amber-700 border-slate-200'
                      }`}
                    >
                      {entry.operationType === 'Internal Transfer' ? 'Transfer' : entry.operationType}
                    </span>

                    <span className={`font-mono font-semibold text-xs ${
                      entry.quantityDelta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {entry.quantityDelta > 0 ? `+${entry.quantityDelta}` : entry.quantityDelta} {entry.unitOfMeasure}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Facility Alerts & Quick Actions (1 col) */}
        <div className="space-y-6">
          {/* Facility Stock Alerts Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
                  Facility Stock Alerts
                </h3>
              </div>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {scopedLowStockAlerts.length} Critical
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {scopedLowStockAlerts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1.5" />
                  All stock items in {warehouseName} are at optimal levels.
                </div>
              ) : (
                scopedLowStockAlerts.map(alert => (
                  <div
                    key={alert.product.id}
                    className="p-3 rounded-lg border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {alert.product.name}
                      </h4>
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        {alert.currentStock} {alert.product.unitOfMeasure}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Threshold: {alert.reorderPoint} {alert.product.unitOfMeasure}</span>
                      <button
                        onClick={() => onNavigate('adjustments')}
                        className="text-primary hover:underline font-semibold"
                      >
                        Recount
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Operations Actions for Staff */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              Direct Operational Shortcuts
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('receipts')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ArrowDownToLine className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                  Record Inbound Receipt
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('delivery_orders')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ArrowUpFromLine className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                  Pick Outbound Delivery
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('internal_transfers')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                  Internal Zone Relocation
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('adjustments')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ClipboardPenLine className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                  Submit Floor Count
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Workflow Guide Notice */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10">
            <h4 className="text-xs font-bold text-primary font-heading flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Operating Protocol
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              As Warehouse Staff, physical count entries are automatically submitted to the Inventory Manager for validation before stock balances adjust.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
