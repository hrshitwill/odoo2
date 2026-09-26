'use client';

import React, { useState } from 'react';
import {
  ArrowDownToLine,
  Plus,
  CircleCheck,
  CircleX,
  Warehouse,
  Printer,
  Calendar,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Receipt } from '@/types/inventory';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { StockMovementArrow } from '@/components/common/StockMovementArrow';
import { formatDateTime } from '@/lib/utils';
import confetti from 'canvas-confetti';

export const ReceiptsView: React.FC = () => {
  const {
    receipts,
    scopedReceipts,
    products,
    warehouses,
    currentUser,
    createReceipt,
    validateReceipt,
    cancelReceipt,
  } = useInventory();

  const isStaff = currentUser.role === 'warehouse_staff';
  const displayReceipts = isStaff ? scopedReceipts : receipts;
  const defaultWhId = isStaff ? (currentUser.warehouseId || 'wh-main') : (warehouses[0]?.id || 'wh-main');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('MetalWorks Ltd.');
  const [destWarehouseId, setDestWarehouseId] = useState(defaultWhId);
  const [destLocationId, setDestLocationId] = useState(
    warehouses.find(w => w.id === defaultWhId)?.locations[0]?.id || 'loc-main-rec'
  );
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 'prod-01');
  const [expectedQty, setExpectedQty] = useState('100');
  const [unitCost, setUnitCost] = useState('4.25');
  const [notes, setNotes] = useState('Urgent replenish for structural framing line.');

  const selectedWarehouse = warehouses.find((w) => w.id === (isStaff ? defaultWhId : destWarehouseId)) || warehouses[0];

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !selectedProductId) return;

    createReceipt({
      supplierName,
      destinationWarehouseId: isStaff ? defaultWhId : destWarehouseId,
      destinationLocationId: destLocationId,
      items: [
        {
          productId: selectedProductId,
          quantityExpected: parseFloat(expectedQty) || 10,
          unitCost: parseFloat(unitCost) || 5,
        },
      ],
      notes,
    });

    setIsModalOpen(false);
  };

  const handleValidate = (receiptId: string) => {
    const success = validateReceipt(receiptId);
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
            Inbound Operations
          </div>
          <h1 className="text-page-title">
            Receipts
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Process supplier deliveries, record inbound quantities, and automatically increase stock
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-primary py-1.5 px-3 text-xs"
        >
          <Plus className="w-4 h-4 text-orange-400" strokeWidth={2} />
          <span>Create Receipt</span>
        </button>
      </div>

      {/* Receipts List */}
      <div className="space-y-3.5">
        {displayReceipts.map((receipt) => {
          const isDone = receipt.status === 'done';
          const isCancelled = receipt.status === 'cancelled';

          return (
            <div
              key={receipt.id}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors space-y-3.5"
            >
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-base font-semibold text-slate-900">
                    {receipt.receiptNumber}
                  </span>
                  <Badge status={receipt.status} size="sm" />
                  <span className="text-xs text-slate-400">
                    {formatDateTime(receipt.createdAt)} · By {receipt.createdByName}
                  </span>
                </div>

                {/* Validation Actions */}
                <div className="flex items-center gap-2">
                  {!isDone && !isCancelled && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleValidate(receipt.id)}
                        className="btn-primary py-1 px-2.5 text-xs bg-emerald-700 hover:bg-emerald-800 border-emerald-700"
                      >
                        <CircleCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Validate (Increase Stock)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelReceipt(receipt.id)}
                        className="px-2 py-1 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-500 text-xs rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {isDone && (
                    <span className="flex items-center gap-1 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-medium">
                      <CircleCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Stock Increased ({formatDateTime(receipt.validatedAt || receipt.createdAt)})
                    </span>
                  )}
                </div>
              </div>

              {/* Movement Arrow */}
              <StockMovementArrow
                source={`Vendor: ${receipt.supplierName}`}
                destination={receipt.destinationLocationName}
                quantity={receipt.items.reduce((s, i) => s + i.quantityExpected, 0)}
                unit={receipt.items[0]?.unitOfMeasure || 'units'}
                operation="Receipt"
              />

              {/* Items Breakdown Table */}
              <div className="bg-slate-50/70 border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/70 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-200 font-medium">
                    <tr>
                      <th className="py-2 px-3.5">Product</th>
                      <th className="py-2 px-3.5 font-mono">SKU</th>
                      <th className="py-2 px-3.5 text-right">Quantity</th>
                      <th className="py-2 px-3.5 text-right">Unit Cost</th>
                      <th className="py-2 px-3.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-body">
                    {receipt.items.map((item, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="py-2 px-3.5 font-medium text-slate-900">
                          {item.productName}
                        </td>
                        <td className="py-2 px-3.5 text-slate-600 font-mono text-[11px]">{item.sku}</td>
                        <td className="py-2 px-3.5 text-right font-mono font-medium text-slate-900">
                          {item.quantityExpected} {item.unitOfMeasure}
                        </td>
                        <td className="py-2 px-3.5 text-right text-slate-500 font-mono">
                          ${item.unitCost?.toFixed(2) || '0.00'}
                        </td>
                        <td className="py-2 px-3.5 text-right font-mono font-medium text-slate-800">
                          ${((item.quantityExpected || 0) * (item.unitCost || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {receipt.notes && (
                <div className="text-xs text-slate-500 italic">
                  Note: {receipt.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Inbound Receipt Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Receipt"
        subtitle="Inbound Goods Intake"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateReceipt} className="space-y-3.5 font-body">
          <div>
            <label className="block text-xs uppercase text-slate-600 font-medium mb-1">
              Supplier *
            </label>
            <input
              type="text"
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. MetalWorks Ltd."
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase text-slate-600 font-medium mb-1">
                Destination Warehouse * {isStaff && <span className="text-[10px] text-primary lowercase">(assigned facility)</span>}
              </label>
              {isStaff ? (
                <div className="w-full bg-slate-100 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 font-medium flex items-center justify-between">
                  <span>{currentUser.assignedWarehouseName || selectedWarehouse?.name || 'Main Central Hub'}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-mono px-1 rounded">LOCKED</span>
                </div>
              ) : (
                <select
                  value={destWarehouseId}
                  onChange={(e) => {
                    setDestWarehouseId(e.target.value);
                    const wh = warehouses.find((w) => w.id === e.target.value);
                    if (wh && wh.locations[0]) {
                      setDestLocationId(wh.locations[0].id);
                    }
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
                Destination Location *
              </label>
              <select
                value={destLocationId}
                onChange={(e) => setDestLocationId(e.target.value)}
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

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2.5">
            <div className="text-[11px] uppercase text-slate-400 font-medium">
              Item Details
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Product *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const prod = products.find((p) => p.id === e.target.value);
                  if (prod) setUnitCost(prod.costPrice.toString());
                }}
                className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} [{p.sku}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-mono">
                  Quantity Expected *
                </label>
                <input
                  type="number"
                  required
                  value={expectedQty}
                  onChange={(e) => setExpectedQty(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1 font-mono">
                  Unit Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
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
              placeholder="e.g. Carrier invoice #BL-8921"
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
              Create Receipt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
