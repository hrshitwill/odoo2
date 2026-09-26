'use client';

import React, { useState } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { NavigationTab } from '@/components/layout/AppSidebar';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  ClipboardPenLine,
  TriangleAlert,
  CircleCheck,
  Clock,
  Warehouse,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  ChevronRight,
  ShieldAlert,
  Send,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OperationStatus } from '@/types/inventory';

interface StaffDashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const StaffDashboardView: React.FC<StaffDashboardViewProps> = ({ onNavigate }) => {
  const {
    currentUser,
    scopedReceipts,
    scopedDeliveries,
    scopedTransfers,
    scopedAdjustments,
    scopedLowStockAlerts,
    staffActivity,
    confirmPhysicalIntake,
    startPicking,
    confirmPacking,
    submitDelivery,
    reportTransferComplete,
    submitStockCount,
    warehouses,
  } = useInventory();

  const [activeQueueTab, setActiveQueueTab] = useState<'all' | 'receipts' | 'deliveries' | 'transfers' | 'counts'>('all');

  // Intake Modal State
  const [intakeModalOpen, setIntakeModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [receivedQtyInput, setReceivedQtyInput] = useState<number>(100);

  // Count Modal State
  const [countModalOpen, setCountModalOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<any>(null);
  const [physicalCountInput, setPhysicalCountInput] = useState<number>(97);
  const [countReason, setCountReason] = useState<string>('Damaged');

  const assignedWarehouseName = currentUser.assignedWarehouseName || 'Main Central Hub';

  // Compute work queue items
  const receiptsQueue = scopedReceipts.map(r => ({
    type: 'Receipt' as const,
    id: r.id,
    docNumber: r.receiptNumber,
    title: `Inbound Intake: ${r.supplierName}`,
    subtitle: `${r.items[0]?.productName || 'Industrial Goods'} · ${r.items[0]?.quantityExpected || 100} units expected`,
    location: r.destinationLocationName || 'Receiving Bay A',
    status: r.status,
    submittedBy: r.submittedBy,
    raw: r,
  }));

  const deliveriesQueue = scopedDeliveries.map(d => ({
    type: 'Delivery' as const,
    id: d.id,
    docNumber: d.deliveryNumber,
    title: `Fulfill Order: ${d.customerName}`,
    subtitle: `${d.items[0]?.productName || 'Goods'} · Picked: ${d.items[0]?.quantityPicked || 0}, Packed: ${d.items[0]?.quantityPacked || 0}`,
    location: d.sourceLocationName || 'Outbound Dispatch Bay',
    status: d.status,
    stage: d.stage,
    submittedBy: d.submittedBy,
    raw: d,
  }));

  const transfersQueue = scopedTransfers.map(t => ({
    type: 'Transfer' as const,
    id: t.id,
    docNumber: t.transferNumber,
    title: `Physical Movement: ${t.items[0]?.productName || 'Materials'}`,
    subtitle: `${t.sourceLocationName} → ${t.destinationLocationName} (${t.items[0]?.quantity || 0} units)`,
    location: `${t.sourceLocationName} → ${t.destinationLocationName}`,
    status: t.status,
    submittedBy: t.submittedBy,
    raw: t,
  }));

  const countsQueue = scopedAdjustments.map(a => {
    const item = a.items[0];
    const sys = item?.recordedQuantity ?? (item as any)?.systemQuantity ?? 100;
    const phys = item?.physicalQuantity ?? 97;
    const diff = phys - sys;
    return {
      type: 'Count' as const,
      id: a.id,
      docNumber: a.adjustmentNumber,
      title: `Physical Count: ${item?.productName || 'Inventory Items'}`,
      subtitle: `System: ${sys} | Counted: ${phys} (${diff >= 0 ? `+${diff}` : diff})`,
      location: a.warehouseName,
      status: a.status,
      submittedBy: a.submittedBy,
      raw: a,
    };
  });

  const allQueue = [
    ...receiptsQueue,
    ...deliveriesQueue,
    ...transfersQueue,
    ...countsQueue,
  ];

  const filteredQueue = allQueue.filter(item => {
    if (activeQueueTab === 'receipts') return item.type === 'Receipt';
    if (activeQueueTab === 'deliveries') return item.type === 'Delivery';
    if (activeQueueTab === 'transfers') return item.type === 'Transfer';
    if (activeQueueTab === 'counts') return item.type === 'Count';
    return true;
  });

  const isCompletedStatus = (status: any) => {
    const s = String(status || '').toUpperCase();
    return s === 'COMPLETED' || s === 'DONE';
  };

  const isAwaitingStatus = (status: any) => {
    const s = String(status || '').toUpperCase();
    return s === 'AWAITING_APPROVAL' || s === 'SUBMITTED' || s === 'WAITING';
  };

  const isRejectedStatus = (status: any) => {
    const s = String(status || '').toUpperCase();
    return s === 'REJECTED' || s === 'CANCELLED';
  };

  const isReadyStatus = (status: any) => {
    const s = String(status || '').toUpperCase();
    return s === 'READY' || s === 'DRAFT' || s === 'WAITING';
  };

  const getStatusBadge = (status: any) => {
    const s = String(status || '').toUpperCase();
    switch (s) {
      case 'READY':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">READY</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-50 text-sky-800 border border-sky-200">IN PROGRESS</span>;
      case 'SUBMITTED':
      case 'AWAITING_APPROVAL':
      case 'WAITING':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">AWAITING APPROVAL</span>;
      case 'COMPLETED':
      case 'DONE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">COMPLETED</span>;
      case 'REJECTED':
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-50 text-rose-800 border border-rose-200">REJECTED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">{s}</span>;
    }
  };

  const handleOpenIntake = (receipt: any) => {
    setSelectedReceipt(receipt);
    setReceivedQtyInput(receipt.items?.[0]?.quantityExpected || 100);
    setIntakeModalOpen(true);
  };

  const handleConfirmIntake = () => {
    if (!selectedReceipt) return;
    confirmPhysicalIntake(selectedReceipt.id);
    setIntakeModalOpen(false);
    setSelectedReceipt(null);
  };

  const handleOpenCountModal = (adjustment: any) => {
    setSelectedAdjustment(adjustment);
    setPhysicalCountInput(adjustment.items?.[0]?.physicalQuantity ?? 97);
    setCountReason(adjustment.reason || 'Damaged');
    setCountModalOpen(true);
  };

  const handleSubmitCount = () => {
    if (!selectedAdjustment) return;
    const phys = Number(physicalCountInput);
    submitStockCount({
      warehouseId: selectedAdjustment.warehouseId || currentUser.warehouseId || 'wh-main',
      reason: countReason as any,
      notes: 'Physical audit counted by warehouse staff',
      items: [{
        productId: selectedAdjustment.items?.[0]?.productId || 'prod-01',
        locationId: selectedAdjustment.items?.[0]?.locationId || 'loc-main-ra',
        physicalQuantity: phys,
      }],
    });
    setCountModalOpen(false);
    setSelectedAdjustment(null);
  };

  return (
    <div className="space-y-6 pb-16 font-body text-slate-900">
      {/* 1. Operational Shift Header (Dark Navy Accent Surface: 20%) */}
      <div className="bg-slate-900 text-white rounded-lg p-5 shadow-xs border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                PHYSICAL EXECUTION QUEUE
              </span>
              <span className="text-slate-500">/</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <Warehouse className="w-3.5 h-3.5 text-orange-400" />
                {assignedWarehouseName}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-white">
              Good morning, {currentUser.name}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Warehouse Staff Workstation. Execute physical intake, picking, packing, internal moves, and stock audits. All completed operations are submitted to the Inventory Manager for official approval.
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg p-3 self-start md:self-auto flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-orange-600/20 text-orange-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="text-slate-400 uppercase tracking-wider text-[10px] font-mono">Assigned Facility</div>
              <div className="font-semibold text-slate-100">{assignedWarehouseName}</div>
              <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Shift Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Today's Work Queue KPI Summary */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 font-mono">
              Floor Assignments
            </span>
            <h2 className="text-base font-bold text-slate-900 font-display">
              TODAY&apos;S WORK QUEUE
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            What do I need to physically do today?
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Receipts */}
          <div
            onClick={() => setActiveQueueTab('receipts')}
            className={cn(
              'p-4 rounded-lg border transition-all cursor-pointer bg-white shadow-2xs',
              activeQueueTab === 'receipts'
                ? 'border-slate-900 ring-1 ring-slate-900'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold font-mono">Receipts</span>
              <ArrowDownToLine className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-display text-slate-900">
              {receiptsQueue.filter(r => !isCompletedStatus(r.status)).length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Physical intake &amp; pallet verification
            </div>
          </div>

          {/* Deliveries */}
          <div
            onClick={() => setActiveQueueTab('deliveries')}
            className={cn(
              'p-4 rounded-lg border transition-all cursor-pointer bg-white shadow-2xs',
              activeQueueTab === 'deliveries'
                ? 'border-slate-900 ring-1 ring-slate-900'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold font-mono">Deliveries</span>
              <ArrowUpFromLine className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-display text-slate-900">
              {deliveriesQueue.filter(d => !isCompletedStatus(d.status)).length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Picking &amp; packing tasks
            </div>
          </div>

          {/* Transfers */}
          <div
            onClick={() => setActiveQueueTab('transfers')}
            className={cn(
              'p-4 rounded-lg border transition-all cursor-pointer bg-white shadow-2xs',
              activeQueueTab === 'transfers'
                ? 'border-slate-900 ring-1 ring-slate-900'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold font-mono">Transfers</span>
              <ArrowRightLeft className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-display text-slate-900">
              {transfersQueue.filter(t => !isCompletedStatus(t.status)).length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Internal zone-to-zone movements
            </div>
          </div>

          {/* Counting Tasks */}
          <div
            onClick={() => setActiveQueueTab('counts')}
            className={cn(
              'p-4 rounded-lg border transition-all cursor-pointer bg-white shadow-2xs',
              activeQueueTab === 'counts'
                ? 'border-slate-900 ring-1 ring-slate-900'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold font-mono">Counting Tasks</span>
              <ClipboardPenLine className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-display text-slate-900">
              {countsQueue.filter(c => !isCompletedStatus(c.status)).length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Physical inventory discrepancy audits
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Work Queue & Staff Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Operational Work Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            {/* Filter Selector */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-800">Queue View:</span>
                <div className="flex items-center gap-1">
                  {(['all', 'receipts', 'deliveries', 'transfers', 'counts'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveQueueTab(tab)}
                      className={cn(
                        'px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer border',
                        activeQueueTab === tab
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {filteredQueue.length} operations
              </span>
            </div>

            {/* List of Tasks */}
            <div className="divide-y divide-slate-100 mt-2">
              {filteredQueue.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" strokeWidth={1.75} />
                  No tasks currently in this queue. All operations completed or assigned elsewhere.
                </div>
              ) : (
                filteredQueue.map(item => {
                  const isAwaiting = isAwaitingStatus(item.status);
                  const isCompleted = isCompletedStatus(item.status);
                  const isRejected = isRejectedStatus(item.status);
                  const isReady = isReadyStatus(item.status);

                  return (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            #{item.docNumber}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">
                            {item.title}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>

                        <p className="text-xs text-slate-600 font-medium">
                          {item.subtitle}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.location}
                          </span>
                          {item.submittedBy && (
                            <span>Submitted by: <strong className="text-slate-700">{item.submittedBy}</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Staff Role-Appropriate Action Buttons */}
                      <div className="shrink-0 flex items-center gap-2">
                        {/* 1. Receiving Intake Action */}
                        {item.type === 'Receipt' && (
                          <>
                            {isReady ? (
                              <button
                                type="button"
                                onClick={() => handleOpenIntake(item.raw)}
                                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <ArrowDownToLine className="w-3.5 h-3.5" />
                                <span>Confirm Physical Intake</span>
                              </button>
                            ) : isAwaiting ? (
                              <span className="text-[11px] text-amber-700 font-mono bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                Submitted for Manager Review
                              </span>
                            ) : isCompleted ? (
                              <span className="text-[11px] text-emerald-700 font-mono bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                Official Inventory Updated
                              </span>
                            ) : null}
                          </>
                        )}

                        {/* 2. Delivery Picking & Packing Actions */}
                        {item.type === 'Delivery' && (
                          <>
                            {item.stage === 'draft' || item.stage === 'pick' || isReady ? (
                              <button
                                type="button"
                                onClick={() => startPicking(item.id)}
                                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <ArrowUpFromLine className="w-3.5 h-3.5" />
                                <span>Start Picking</span>
                              </button>
                            ) : item.stage === 'pack' ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => confirmPacking(item.id)}
                                  className="px-2.5 py-1.5 rounded bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-medium transition-colors cursor-pointer"
                                >
                                  Confirm Packing
                                </button>
                                <button
                                  type="button"
                                  onClick={() => submitDelivery(item.id)}
                                  className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Submit Delivery</span>
                                </button>
                              </div>
                            ) : isAwaiting ? (
                              <span className="text-[11px] text-amber-700 font-mono bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                Submitted for Manager Review
                              </span>
                            ) : isCompleted ? (
                              <span className="text-[11px] text-emerald-700 font-mono bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                Dispatched &amp; Stock Deducted
                              </span>
                            ) : null}
                          </>
                        )}

                        {/* 3. Internal Transfer Action */}
                        {item.type === 'Transfer' && (
                          <>
                            {isReady ? (
                              <button
                                type="button"
                                onClick={() => reportTransferComplete(item.id)}
                                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span>Report Transfer Complete</span>
                              </button>
                            ) : isAwaiting ? (
                              <span className="text-[11px] text-amber-700 font-mono bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                Submitted for Manager Review
                              </span>
                            ) : isCompleted ? (
                              <span className="text-[11px] text-emerald-700 font-mono bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                Location Stock Updated
                              </span>
                            ) : null}
                          </>
                        )}

                        {/* 4. Counting Task (Stock Adjustment) Action */}
                        {item.type === 'Count' && (
                          <>
                            {isReady ? (
                              <button
                                type="button"
                                onClick={() => handleOpenCountModal(item.raw)}
                                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <ClipboardPenLine className="w-3.5 h-3.5" />
                                <span>Submit Count</span>
                              </button>
                            ) : isAwaiting ? (
                              <span className="text-[11px] text-amber-700 font-mono bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                Awaiting Manager Approval
                              </span>
                            ) : isCompleted ? (
                              <span className="text-[11px] text-emerald-700 font-mono bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                Count Approved &amp; Reconciled
                              </span>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: MY ACTIVITY & Operational Alerts */}
        <div className="space-y-5">
          {/* MY ACTIVITY Section (Replacing full Stock Ledger for Staff) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 font-mono">
                  Personal Work Log
                </span>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  MY ACTIVITY
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {currentUser.name}
              </span>
            </div>

            <div className="space-y-3">
              {staffActivity.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No activity recorded yet for this shift.
                </div>
              ) : (
                staffActivity.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 text-xs space-y-1 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-slate-500">
                        {act.time}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        {act.status}
                      </span>
                    </div>

                    <div className="font-medium text-slate-900">
                      {act.action}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Ref: #{act.reference}</span>
                      {act.details && <span className="truncate max-w-[120px]">{act.details}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Warehouse Scoped Alerts */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2 text-amber-800">
                <TriangleAlert className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  Facility Stock Alerts
                </h3>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                {scopedLowStockAlerts.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {scopedLowStockAlerts.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  All items in {assignedWarehouseName} within safe levels.
                </div>
              ) : (
                scopedLowStockAlerts.map(alert => (
                  <div
                    key={alert.product.id}
                    className="p-3 rounded border border-amber-200 bg-amber-50/60 text-xs space-y-1"
                  >
                    <div className="flex items-start justify-between font-medium text-slate-900">
                      <span>{alert.product.name}</span>
                      <span className="font-mono text-amber-800 font-bold">
                        {alert.currentStock} {alert.product.unitOfMeasure}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Min threshold: {alert.reorderPoint}</span>
                      <button
                        type="button"
                        onClick={() => onNavigate('adjustments')}
                        className="text-slate-900 font-semibold underline hover:text-slate-700 cursor-pointer"
                      >
                        Count Stock
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Operational Policy Reminder */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-700" />
              Two-Role Operating Protocol
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Warehouse Staff records physical quantities and submits operations. Official inventory and the stock ledger update only after review and approval by an Inventory Manager.
            </p>
          </div>
        </div>
      </div>

      {/* Intake Verification Modal */}
      {intakeModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm">
                  Physical Intake Verification
                </h3>
                <p className="text-[11px] text-slate-300 font-mono">
                  Receipt #{selectedReceipt.receiptNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIntakeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-medium text-slate-900">{selectedReceipt.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination Bay:</span>
                  <span className="font-mono text-slate-800">{selectedReceipt.destinationLocationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedReceipt.items[0]?.quantityExpected || 100} units
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Physically Counted Units:
                </label>
                <input
                  type="number"
                  min="0"
                  value={receivedQtyInput}
                  onChange={(e) => setReceivedQtyInput(Number(e.target.value))}
                  className="w-full text-sm font-mono p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Confirming physical intake marks this document as <strong className="text-slate-700">AWAITING APPROVAL</strong> and notifies the Manager. Inventory is not changed immediately.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIntakeModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmIntake}
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium cursor-pointer"
                >
                  Confirm Physical Intake
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Physical Count Discrepancy Modal */}
      {countModalOpen && selectedAdjustment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm">
                  Physical Count Submission
                </h3>
                <p className="text-[11px] text-slate-300 font-mono">
                  Audit #{selectedAdjustment.adjustmentNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCountModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-medium text-slate-900">
                    {selectedAdjustment.items[0]?.productName || 'Industrial Bolts'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">System Recorded Stock:</span>
                  <span className="font-mono text-slate-800">
                    {selectedAdjustment.items[0]?.systemQuantity ?? 100} units
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Actual Physical Count:
                </label>
                <input
                  type="number"
                  value={physicalCountInput}
                  onChange={(e) => setPhysicalCountInput(Number(e.target.value))}
                  className="w-full text-sm font-mono p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-amber-50 border border-amber-200 text-amber-900">
                <span>Calculated Discrepancy:</span>
                <strong className="font-mono text-sm">
                  {physicalCountInput - (selectedAdjustment.items[0]?.systemQuantity ?? 100) > 0
                    ? `+${physicalCountInput - (selectedAdjustment.items[0]?.systemQuantity ?? 100)}`
                    : physicalCountInput - (selectedAdjustment.items[0]?.systemQuantity ?? 100)} units
                </strong>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Discrepancy Reason:
                </label>
                <select
                  value={countReason}
                  onChange={(e) => setCountReason(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded bg-white"
                >
                  <option value="Damaged">Damaged</option>
                  <option value="Lost">Lost / Missing</option>
                  <option value="Data Entry Correction">Data Entry Correction</option>
                  <option value="Physical Count">Routine Audit Discrepancy</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCountModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitCount}
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium cursor-pointer"
                >
                  Submit Count
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
