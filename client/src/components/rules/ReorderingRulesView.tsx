'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Plus,
  TriangleAlert,
  CircleCheck,
  Package,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Calculator,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { ReorderingRule } from '@/types/inventory';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { NavigationTab } from '@/components/layout/AppSidebar';

interface ReorderingRulesViewProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const ReorderingRulesView: React.FC<ReorderingRulesViewProps> = ({ onNavigate }) => {
  const { reorderRules, products, warehouses, addReorderRule, updateReorderRule, getTotalStockForProduct } =
    useInventory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 'prod-01');
  const [selectedWhId, setSelectedWhId] = useState(warehouses[0]?.id || 'wh-main');
  const [minStock, setMinStock] = useState('50');
  const [maxStock, setMaxStock] = useState('300');
  const [leadTime, setLeadTime] = useState('4');
  const [supplierName, setSupplierName] = useState('MetalWorks Ltd.');

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === selectedProductId);
    const wh = warehouses.find((w) => w.id === selectedWhId);
    if (!prod || !wh) return;

    const min = parseInt(minStock, 10) || 10;
    const max = parseInt(maxStock, 10) || 100;

    addReorderRule({
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      warehouseId: wh.id,
      warehouseName: wh.name,
      minStock: min,
      maxStock: max,
      reorderQuantity: Math.max(1, max - min),
      unitOfMeasure: prod.unitOfMeasure,
      isActive: true,
      leadTimeDays: parseInt(leadTime, 10) || 3,
      supplierName: supplierName || prod.supplierName || 'Primary Supplier',
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-[11px] font-sans uppercase tracking-wider text-slate-500 font-semibold mb-1">
            Automated Inventory Controls
          </div>
          <h1 className="text-page-title text-slate-950">
            Reordering Rules &amp; Safety Buffers
          </h1>
          <p className="text-sm text-slate-600 font-sans mt-0.5">
            Configured inventory thresholds: Min-Max replenishment triggers based on defined safety stock
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-sans font-medium hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 text-orange-400" strokeWidth={1.75} />
          <span>New Reorder Rule</span>
        </button>
      </div>

      {/* Explanatory Industrial Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-sans">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <Calculator className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">Transparent Reorder Formula</h4>
            <p className="text-slate-600 font-sans text-xs">
              When Available &lt; <strong className="text-slate-900 font-medium">Min Threshold</strong> → Suggested Order ={' '}
              <strong className="text-slate-900 font-medium">Max Capacity - Current Stock</strong>
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded border border-slate-200 shrink-0 font-medium">
          Rule Monitoring Active
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reorderRules.map((rule) => {
          const prod = products.find((p) => p.id === rule.productId);
          const currentTotal = prod ? getTotalStockForProduct(prod) : 0;
          const isTriggered = currentTotal <= rule.minStock;
          const suggested = Math.max(0, rule.maxStock - currentTotal);

          return (
            <div
              key={rule.id}
              className={`p-5 bg-white border rounded-xl shadow-xs transition-all space-y-4 ${
                isTriggered
                  ? 'border-amber-300 ring-1 ring-amber-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Top Bar */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-slate-900 font-sans">{rule.productName}</h3>
                  </div>
                  <div className="text-xs text-slate-500 font-sans mt-0.5">
                    SKU: <span className="font-mono text-slate-700">{rule.sku}</span> · {rule.warehouseName}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={isTriggered ? 'warning' : 'success'}>
                    {isTriggered ? 'Triggered / Low' : 'Optimal'}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => updateReorderRule(rule.id, { isActive: !rule.isActive })}
                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    {rule.isActive ? (
                      <ToggleRight className="w-6 h-6 text-slate-900" strokeWidth={1.75} />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-300" strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>

              {/* Mathematical Parameters Grid */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs font-sans text-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Min Buffer</div>
                  <div className="font-semibold text-slate-800 text-sm mt-0.5 font-display">
                    {rule.minStock} <span className="text-xs font-normal font-sans text-slate-500">{rule.unitOfMeasure}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Max Storage</div>
                  <div className="font-semibold text-slate-800 text-sm mt-0.5 font-display">
                    {rule.maxStock} <span className="text-xs font-normal font-sans text-slate-500">{rule.unitOfMeasure}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Current Stock</div>
                  <div
                    className={`font-semibold text-sm mt-0.5 font-display ${
                      isTriggered ? 'text-amber-600' : 'text-emerald-700'
                    }`}
                  >
                    {currentTotal} <span className="text-xs font-normal font-sans text-slate-500">{rule.unitOfMeasure}</span>
                  </div>
                </div>
              </div>

              {/* Rule Explanation & Suggested Action */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs font-sans space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Reorder Trigger Condition:</span>
                  <span className="font-medium text-slate-900">
                    Stock &lt; {rule.minStock} {rule.unitOfMeasure}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Supplier &amp; Lead Time:</span>
                  <span className="text-slate-800">
                    {rule.supplierName} ({rule.leadTimeDays} days)
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-900 font-medium">
                  <span>Suggested PO Quantity:</span>
                  <span className="text-orange-600 font-display font-semibold text-sm">
                    +{suggested} {rule.unitOfMeasure}
                  </span>
                </div>
              </div>

              {/* Fast Action */}
              {isTriggered && (
                <button
                  type="button"
                  onClick={() => onNavigate('receipts')}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-sans font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <span>Generate Inbound PO for +{suggested} {rule.unitOfMeasure}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-orange-400" strokeWidth={1.75} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* New Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Configure Reordering Rule"
        subtitle="Min-Max Buffer Replenishment Formula"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRule} className="space-y-4">
          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Select Article *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const prod = products.find((p) => p.id === e.target.value);
                if (prod) {
                  setMinStock(prod.reorderPoint.toString());
                  setMaxStock(prod.maxStock.toString());
                  if (prod.supplierName) setSupplierName(prod.supplierName);
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.sku}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Assigned Warehouse *
            </label>
            <select
              value={selectedWhId}
              onChange={(e) => setSelectedWhId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} [{w.code}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Minimum Stock (Trigger Threshold) *
              </label>
              <input
                type="number"
                required
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Maximum Stock Target *
              </label>
              <input
                type="number"
                required
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Vendor Lead Time (Days)
              </label>
              <input
                type="number"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-sans font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-sans font-medium hover:bg-slate-800 shadow-xs cursor-pointer"
            >
              Activate Reorder Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
