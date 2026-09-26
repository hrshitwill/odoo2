'use client';

import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Plus,
  CircleCheck,
  Check,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { StockMovementArrow } from '@/components/common/StockMovementArrow';
import { formatDateTime } from '@/lib/utils';
import confetti from 'canvas-confetti';

export const InternalTransfersView: React.FC = () => {
  const {
    transfers,
    scopedTransfers,
    products,
    warehouses,
    currentUser,
    createInternalTransfer,
    validateTransfer,
    cancelTransfer,
  } = useInventory();

  const isStaff = currentUser.role === 'warehouse_staff';
  const displayTransfers = isStaff ? scopedTransfers : transfers;
  const defaultWhId = isStaff ? (currentUser.warehouseId || 'wh-main') : (warehouses[0]?.id || 'wh-main');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceWhId, setSourceWhId] = useState(defaultWhId);
  const [sourceLocId, setSourceLocId] = useState(
    warehouses.find(w => w.id === defaultWhId)?.locations[1]?.id || 'loc-main-ra'
  );

  const [destWhId, setDestWhId] = useState(warehouses[1]?.id || 'wh-prod');
  const [destLocId, setDestLocId] = useState(warehouses[1]?.locations[1]?.id || 'loc-prod-rc');

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 'prod-01');
  const [transferQty, setTransferQty] = useState('120');
  const [notes, setNotes] = useState('Routine replenishment from bulk raw store to fabrication line.');

  const sourceWarehouse = warehouses.find((w) => w.id === sourceWhId) || warehouses[0];
  const destWarehouse = warehouses.find((w) => w.id === destWhId) || warehouses[1] || warehouses[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    createInternalTransfer({
      sourceWarehouseId: sourceWhId,
      sourceLocationId: sourceLocId,
      destinationWarehouseId: destWhId,
      destinationLocationId: destLocId,
      items: [
        {
          productId: selectedProductId,
          quantity: parseFloat(transferQty) || 10,
        },
      ],
      notes,
    });

    setIsModalOpen(false);
  };

  const handleExecute = (transferId: string) => {
    const success = validateTransfer(transferId);
    if (success) {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch (err) {}
    }
  };

  return (
    <div className="space-y-6 pb-16 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-metadata uppercase tracking-wider text-slate-400 font-medium">
            Internal Operations
          </div>
          <h1 className="text-page-title">
            Internal Transfers
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Move stock inside company locations. Total company stock remains unchanged while location balances update.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-primary py-1.5 px-3 text-xs"
        >
          <Plus className="w-4 h-4 text-orange-400" strokeWidth={2} />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Transfers List */}
      <div className="space-y-3.5">
        {displayTransfers.map((transfer) => {
          const isDone = transfer.status === 'done';
          const isCancelled = transfer.status === 'cancelled';
          const item = transfer.items[0];

          return (
            <div
              key={transfer.id}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors space-y-3.5"
            >
              {/* Header Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-base font-semibold text-slate-900">
                    {transfer.transferNumber}
                  </span>
                  <Badge status={transfer.status} size="sm" />
                  <span className="text-xs text-slate-400">
                    Scheduled by {transfer.createdByName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isDone && !isCancelled && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleExecute(transfer.id)}
                        className="btn-primary py-1 px-2.5 text-xs bg-sky-700 hover:bg-sky-800 border-sky-700"
                      >
                        <Check className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Validate Transfer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelTransfer(transfer.id)}
                        className="px-2 py-1 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-500 text-xs rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {isDone && (
                    <span className="flex items-center gap-1 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-medium">
                      <CircleCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Completed ({formatDateTime(transfer.completedAt || transfer.scheduledDate)})
                    </span>
                  )}
                </div>
              </div>

              {/* Movement Vector */}
              <div className="p-3 bg-slate-50/70 border border-slate-200 rounded">
                <StockMovementArrow
                  source={transfer.sourceLocationName}
                  destination={transfer.destinationLocationName}
                  quantity={item ? item.quantity : 0}
                  unit={item?.unitOfMeasure || 'units'}
                  operation={item ? item.productName : 'Transfer'}
                />
              </div>

              {transfer.notes && (
                <div className="text-xs text-slate-500 italic">
                  Note: {transfer.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Internal Transfer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Internal Transfer"
        subtitle="Inter-Location Movement"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-3.5 font-body">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2.5">
            <div className="text-[11px] uppercase text-slate-500 font-medium">
              From Location (Source)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Warehouse
                </label>
                <select
                  value={sourceWhId}
                  onChange={(e) => {
                    setSourceWhId(e.target.value);
                    const wh = warehouses.find((w) => w.id === e.target.value);
                    if (wh && wh.locations[0]) setSourceLocId(wh.locations[0].id);
                  }}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Location
                </label>
                <select
                  value={sourceLocId}
                  onChange={(e) => setSourceLocId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {sourceWarehouse?.locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} [{l.code}]
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2.5">
            <div className="text-[11px] uppercase text-slate-500 font-medium">
              To Location (Destination)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Warehouse
                </label>
                <select
                  value={destWhId}
                  onChange={(e) => {
                    setDestWhId(e.target.value);
                    const wh = warehouses.find((w) => w.id === e.target.value);
                    if (wh && wh.locations[0]) setDestLocId(wh.locations[0].id);
                  }}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Location
                </label>
                <select
                  value={destLocId}
                  onChange={(e) => setDestLocId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {destWarehouse?.locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} [{l.code}]
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

            <div>
              <label className="block text-xs uppercase text-slate-600 font-medium mb-1 font-mono">
                Quantity *
              </label>
              <input
                type="number"
                required
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-600 font-medium mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Relocating buffer stock to assembly floor"
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary py-1.5 px-3 text-xs"
            >
              Schedule Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
