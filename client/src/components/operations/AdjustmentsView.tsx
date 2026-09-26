'use client';

import React, { useState } from 'react';
import { ClipboardPenLine, Plus, CircleCheck, Clock, AlertCircle } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { AdjustmentReason } from '@/types/inventory';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { formatDateTime } from '@/lib/utils';
import confetti from 'canvas-confetti';

export const AdjustmentsView: React.FC = () => {
  const {
    adjustments,
    scopedAdjustments,
    products,
    warehouses,
    currentUser,
    createStockAdjustment,
    validateStockAdjustment,
    approveAdjustment,
    rejectAdjustment,
    submitStockCount,
  } = useInventory();

  const isStaff = currentUser.role === 'warehouse_staff';
  const isManager = currentUser.role === 'inventory_manager';
  const displayAdjustments = isStaff ? scopedAdjustments : adjustments;

  const defaultWhId = isStaff ? (currentUser.warehouseId || 'wh-main') : (warehouses[0]?.id || 'wh-main');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWhId, setSelectedWhId] = useState(defaultWhId);
  const [selectedLocId, setSelectedLocId] = useState(
    warehouses.find(w => w.id === defaultWhId)?.locations[1]?.id || 'loc-main-ra'
  );
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 'prod-01');
  const [physicalCount, setPhysicalCount] = useState('42');
  const [reason, setReason] = useState<AdjustmentReason>('Damaged');
  const [notes, setNotes] = useState('Physical audit mismatch detected during floor cycle count.');

  const selectedWarehouse = warehouses.find((w) => w.id === selectedWhId) || warehouses[0];
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const currentLocStock = selectedProduct?.locationStock?.find(
    (ls) => ls.locationId === selectedLocId
  );
  const systemQty = currentLocStock ? currentLocStock.quantity : 0;
  const countedNum = parseFloat(physicalCount) || 0;
  const diff = countedNum - systemQty;

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    createStockAdjustment({
      warehouseId: isStaff ? defaultWhId : selectedWhId,
      reason,
      notes,
      items: [
        {
          productId: selectedProductId,
          locationId: selectedLocId,
          physicalQuantity: countedNum,
        },
      ],
    });

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (e) {}

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-metadata uppercase tracking-wider text-slate-400 font-medium">
            Inventory Accuracy &bull; {isStaff ? (currentUser.assignedWarehouseName || 'Main Central Hub') : 'Corporate Audit'}
          </div>
          <h1 className="text-page-title">
            Stock Adjustments
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isStaff
              ? 'Record physical counts for your assigned facility. Counts are submitted to the Inventory Manager for validation.'
              : 'Review and validate floor counts, manage physical discrepancies, and record write-offs.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isStaff) setSelectedWhId(defaultWhId);
            setIsModalOpen(true);
          }}
          className="btn-primary py-1.5 px-3 text-xs"
        >
          <Plus className="w-4 h-4 text-orange-400" strokeWidth={2} />
          <span>{isStaff ? 'Submit Count' : 'New Adjustment'}</span>
        </button>
      </div>

      {/* Adjustments List */}
      <div className="space-y-3.5">
        {displayAdjustments.map((adj) => {
          const item = adj.items[0];
          const s = String(adj.status || '').toLowerCase();
          const isAwaiting = s.includes('wait') || s.includes('submit');
          const isDone = s === 'completed' || s === 'done';
          const isCancelled = s === 'rejected' || s === 'cancelled';

          return (
            <div
              key={adj.id}
              className={`p-4 bg-white border rounded-lg transition-colors space-y-3 ${
                isAwaiting
                  ? 'border-amber-300 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-base font-semibold text-slate-900">
                    {adj.adjustmentNumber}
                  </span>
                  <Badge variant={adj.reason === 'Damaged' ? 'danger' : 'neutral'} size="sm">
                    {adj.reason}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    Recorded {formatDateTime(adj.createdAt)} by {adj.createdByName || adj.submittedBy}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isAwaiting && (
                    <>
                      <span className="flex items-center gap-1 text-xs text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Awaiting Manager Approval {adj.submittedBy ? `(${adj.submittedBy})` : ''}
                      </span>
                      {isManager && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              approveAdjustment(adj.id);
                              try {
                                confetti({ particleCount: 35, spread: 45 });
                              } catch (e) {}
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          >
                            <CircleCheck className="w-3.5 h-3.5" />
                            Approve Adjustment
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const r = prompt('Rejection reason:', 'Count discrepancy unverified');
                              if (r !== null) {
                                rejectAdjustment(adj.id, r);
                              }
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {isDone && (
                    <span className="flex items-center gap-1 text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      <CircleCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Adjusted &amp; Validated {adj.approvedBy ? `(${adj.approvedBy})` : ''}
                    </span>
                  )}

                  {isCancelled && (
                    <span className="flex items-center gap-1 text-xs text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium">
                      Rejected {adj.rejectionReason ? `· ${adj.rejectionReason}` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Adjustment Display */}
              {item && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-medium">Product</span>
                    <div className="font-semibold text-slate-900 mt-0.5">{item.productName}</div>
                    <div className="text-[11px] text-slate-400">{item.locationName}</div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-medium">System Quantity</span>
                    <div className="font-mono font-medium text-slate-700 text-sm mt-0.5">
                      {item.recordedQuantity} {item.unitOfMeasure}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-medium">Physical Count</span>
                    <div className="font-mono font-semibold text-slate-900 text-sm mt-0.5">
                      {item.physicalQuantity} {item.unitOfMeasure}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-medium">Difference</span>
                    <div
                      className={`font-mono font-bold text-sm mt-0.5 ${
                        item.difference < 0
                          ? 'text-rose-600'
                          : item.difference > 0
                          ? 'text-emerald-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {item.difference > 0 ? `+${item.difference}` : item.difference}{' '}
                      <span className="text-xs font-normal">{item.unitOfMeasure}</span>
                    </div>
                  </div>
                </div>
              )}

              {adj.notes && (
                <p className="text-xs text-slate-500 italic">
                  Reason / Notes: {adj.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* New Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Stock Adjustment"
        subtitle="Physical Count Reconciliation"
        maxWidth="lg"
      >
        <form onSubmit={handleAdjust} className="space-y-3.5 font-body">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase text-slate-600 font-medium mb-1">
                Warehouse * {isStaff && <span className="text-[10px] text-primary lowercase">(assigned facility)</span>}
              </label>
              {isStaff ? (
                <div className="w-full bg-slate-100 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 font-medium flex items-center justify-between">
                  <span>{currentUser.assignedWarehouseName || selectedWarehouse?.name || 'Main Central Hub'}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-mono px-1 rounded">LOCKED</span>
                </div>
              ) : (
                <select
                  value={selectedWhId}
                  onChange={(e) => {
                    setSelectedWhId(e.target.value);
                    const wh = warehouses.find((w) => w.id === e.target.value);
                    if (wh && wh.locations[0]) setSelectedLocId(wh.locations[0].id);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-600 font-medium mb-1">
                Location *
              </label>
              <select
                value={selectedLocId}
                onChange={(e) => setSelectedLocId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {selectedWarehouse?.locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} [{l.code}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-600 font-medium mb-1">
              Product *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.sku}]
                </option>
              ))}
            </select>
          </div>

          {/* Variance Calculation Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-2.5">
            <div className="flex items-center justify-between text-xs border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">System Recorded Quantity:</span>
              <strong className="text-slate-800 font-mono font-medium">
                {systemQty} {selectedProduct?.unitOfMeasure}
              </strong>
            </div>

            <div>
              <label className="block text-xs text-slate-600 font-medium mb-1">
                Physical Count Quantity *
              </label>
              <input
                type="number"
                required
                value={physicalCount}
                onChange={(e) => setPhysicalCount(e.target.value)}
                placeholder="Enter physical count"
                className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-sm font-mono font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
              <span className="text-slate-600 font-medium">Calculated Difference:</span>
              <span
                className={`font-mono text-base font-semibold ${
                  diff < 0
                    ? 'text-rose-600'
                    : diff > 0
                    ? 'text-emerald-700'
                    : 'text-slate-700'
                }`}
              >
                {diff > 0 ? `+${diff}` : diff} {selectedProduct?.unitOfMeasure}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-600 font-medium mb-1">
              Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as AdjustmentReason)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="Damaged">Damaged</option>
              <option value="Inventory Count / Cycle">Cycle Count / Recount</option>
              <option value="Lost Goods">Lost Goods</option>
              <option value="Found Goods">Found Goods</option>
              <option value="Calibration Error">Calibration Error</option>
              <option value="Theft">Shrinkage / Discrepancy</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-600 font-medium mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 3 kg steel damaged"
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {isStaff && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Staff Workflow Notice:
              </p>
              <p className="mt-0.5 text-amber-700">
                Staff submissions create a &quot;Pending Approval&quot; record. The Inventory Manager will review and validate before physical inventory is modified.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary py-1.5 px-3 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary py-1.5 px-3 text-xs cursor-pointer"
            >
              {isStaff ? 'Submit Count for Manager Validation' : 'Confirm & Apply Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
