'use client';

import React, { useState } from 'react';
import {
  ArrowUpFromLine,
  Plus,
  CircleCheck,
  Box,
  ClipboardList,
  Check,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { DeliveryOrder, DeliveryStage } from '@/types/inventory';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { StockMovementArrow, MultiStageFlowVisualizer } from '@/components/common/StockMovementArrow';
import { formatDateTime } from '@/lib/utils';
import confetti from 'canvas-confetti';

export const DeliveryOrdersView: React.FC = () => {
  const {
    deliveries,
    scopedDeliveries,
    products,
    warehouses,
    currentUser,
    createDelivery,
    advanceDeliveryStage,
    cancelDelivery,
  } = useInventory();

  const isStaff = currentUser.role === 'warehouse_staff';
  const displayDeliveries = isStaff ? scopedDeliveries : deliveries;
  const defaultWhId = isStaff ? (currentUser.warehouseId || 'wh-main') : (warehouses[0]?.id || 'wh-main');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('AeroStructures Engineering');
  const [sourceWarehouseId, setSourceWarehouseId] = useState(defaultWhId);
  const [sourceLocationId, setSourceLocationId] = useState(
    warehouses.find(w => w.id === defaultWhId)?.locations[1]?.id || 'loc-main-ra'
  );
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 'prod-01');
  const [requestedQty, setRequestedQty] = useState('20');
  const [notes, setNotes] = useState('Priority dispatch for production line frame assembly.');

  const selectedWarehouse = warehouses.find((w) => w.id === (isStaff ? defaultWhId : sourceWarehouseId)) || warehouses[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !selectedProductId) return;

    createDelivery({
      customerName,
      sourceWarehouseId: isStaff ? defaultWhId : sourceWarehouseId,
      sourceLocationId,
      items: [
        {
          productId: selectedProductId,
          quantityRequested: parseFloat(requestedQty) || 5,
        },
      ],
      notes,
    });

    setIsModalOpen(false);
  };

  const handleAdvance = (deliveryId: string, targetStage: DeliveryStage) => {
    const success = advanceDeliveryStage(deliveryId, targetStage);
    if (success && targetStage === 'done') {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch (err) {}
    }
  };

  const getStageSteps = (stage: DeliveryStage) => {
    return [
      { label: 'Pick', active: stage === 'pick' || stage === 'draft', done: stage === 'pack' || stage === 'validate' || stage === 'done' },
      { label: 'Pack', active: stage === 'pack', done: stage === 'validate' || stage === 'done' },
      { label: 'Validate', active: stage === 'validate', done: stage === 'done' },
    ];
  };

  return (
    <div className="space-y-6 pb-16 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-metadata uppercase tracking-wider text-slate-400 font-medium">
            Outbound Operations
          </div>
          <h1 className="text-page-title">
            Delivery Orders
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Stage-driven outbound workflow: Pick items → Pack carton → Validate &amp; decrease stock
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-primary py-1.5 px-3 text-xs"
        >
          <Plus className="w-4 h-4 text-orange-400" strokeWidth={2} />
          <span>Create Delivery</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-3.5">
        {displayDeliveries.map((delivery) => {
          const isDone = delivery.stage === 'done';
          const isCancelled = delivery.status === 'cancelled';
          const stages = getStageSteps(delivery.stage);

          return (
            <div
              key={delivery.id}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors space-y-3.5"
            >
              {/* Header Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-base font-semibold text-slate-900">
                    {delivery.deliveryNumber}
                  </span>
                  <Badge status={delivery.stage} size="sm" />
                  <span className="text-xs text-slate-400">
                    Tracking: {delivery.trackingNumber} · By {delivery.createdByName}
                  </span>
                </div>

                {/* Stage Action Controls */}
                <div className="flex items-center gap-2">
                  {!isDone && !isCancelled && (
                    <>
                      {delivery.stage === 'draft' || delivery.stage === 'pick' ? (
                        <button
                          type="button"
                          onClick={() => handleAdvance(delivery.id, 'pack')}
                          className="btn-primary py-1 px-2.5 text-xs"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-orange-400" strokeWidth={1.75} />
                          <span>Advance to Pack</span>
                        </button>
                      ) : delivery.stage === 'pack' ? (
                        <button
                          type="button"
                          onClick={() => handleAdvance(delivery.id, 'validate')}
                          className="btn-primary py-1 px-2.5 text-xs"
                        >
                          <Box className="w-3.5 h-3.5 text-orange-400" strokeWidth={1.75} />
                          <span>Ready to Validate</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdvance(delivery.id, 'done')}
                          className="btn-primary py-1 px-2.5 text-xs bg-emerald-700 hover:bg-emerald-800 border-emerald-700"
                        >
                          <CircleCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span>Validate &amp; Deduct Stock</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => cancelDelivery(delivery.id)}
                        className="px-2 py-1 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-500 text-xs rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {isDone && (
                    <span className="flex items-center gap-1 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-medium">
                      <CircleCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Dispatched ({formatDateTime(delivery.validatedAt || delivery.createdAt)})
                    </span>
                  )}
                </div>
              </div>

              {/* Multi-Stage Visualizer */}
              <div className="bg-slate-50/70 p-2.5 rounded border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-metadata text-slate-500 uppercase tracking-wider">
                  Fulfillment Stage:
                </span>
                <MultiStageFlowVisualizer stages={stages} />
              </div>

              {/* Movement Vector */}
              <StockMovementArrow
                source={delivery.sourceLocationName}
                destination={`Customer: ${delivery.customerName}`}
                quantity={delivery.items.reduce((s, i) => s + i.quantityRequested, 0)}
                unit={delivery.items[0]?.unitOfMeasure || 'units'}
                operation="Delivery"
              />

              {/* Items Table */}
              <div className="bg-slate-50/70 border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/70 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-200 font-medium">
                    <tr>
                      <th className="py-2 px-3.5">Product</th>
                      <th className="py-2 px-3.5 font-mono">SKU</th>
                      <th className="py-2 px-3.5 text-right">Requested</th>
                      <th className="py-2 px-3.5 text-right">Picked</th>
                      <th className="py-2 px-3.5 text-right">Packed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-body">
                    {delivery.items.map((item, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="py-2 px-3.5 font-medium text-slate-900">
                          {item.productName}
                        </td>
                        <td className="py-2 px-3.5 text-slate-600 font-mono text-[11px]">{item.sku}</td>
                        <td className="py-2 px-3.5 text-right font-mono font-medium text-slate-900">
                          {item.quantityRequested} {item.unitOfMeasure}
                        </td>
                        <td className="py-2 px-3.5 text-right font-mono text-slate-600">
                          {item.quantityPicked} {item.unitOfMeasure}
                        </td>
                        <td className="py-2 px-3.5 text-right font-mono text-slate-600">
                          {item.quantityPacked} {item.unitOfMeasure}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Delivery Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Delivery Order"
        subtitle="Outgoing Goods Dispatch"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-3.5 font-body">
          <div>
            <label className="block text-xs uppercase text-slate-600 font-medium mb-1">
              Customer *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. AeroStructures Engineering"
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase text-slate-600 font-medium mb-1">
                Source Warehouse * {isStaff && <span className="text-[10px] text-primary lowercase">(assigned facility)</span>}
              </label>
              {isStaff ? (
                <div className="w-full bg-slate-100 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 font-medium flex items-center justify-between">
                  <span>{currentUser.assignedWarehouseName || selectedWarehouse?.name || 'Main Central Hub'}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-mono px-1 rounded">LOCKED</span>
                </div>
              ) : (
                <select
                  value={sourceWarehouseId}
                  onChange={(e) => {
                    setSourceWarehouseId(e.target.value);
                    const wh = warehouses.find((w) => w.id === e.target.value);
                    if (wh && wh.locations[0]) {
                      setSourceLocationId(wh.locations[0].id);
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
                Source Location *
              </label>
              <select
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
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
              Article to Dispatch
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Product *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} [{p.sku}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1 font-mono">
                Requested Quantity *
              </label>
              <input
                type="number"
                required
                value={requestedQty}
                onChange={(e) => setRequestedQty(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
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
              placeholder="e.g. Sales order #SO-4401"
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
              Create Delivery Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
