'use client';

import React, { useState } from 'react';
import { Product } from '@/types/inventory';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { PrintLabelModal } from '@/components/common/PrintLabelModal';
import { useInventory } from '@/context/InventoryContext';
import { formatNumber, formatCurrency, formatDateTime } from '@/lib/utils';
import {
  ArrowRightLeft,
  ClipboardPenLine,
  ArrowDownToLine,
  MapPin,
  Warehouse,
  Printer,
  Barcode,
} from 'lucide-react';
import { NavigationTab } from '@/components/layout/AppSidebar';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { getTotalStockForProduct, getAvailableStockForProduct, ledger, currentUser } = useInventory();
  const isStaff = currentUser.role === 'warehouse_staff';
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  if (!product) return null;

  const totalStock = getTotalStockForProduct(product);
  const availableStock = getAvailableStockForProduct(product);
  const reservedStock = totalStock - availableStock;

  const isLowStock = totalStock <= product.reorderPoint && totalStock > 0;
  const isOutOfStock = totalStock === 0;

  const productMovements = ledger.filter((l) => l.productId === product.id).slice(0, 6);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={product.name}
        subtitle={`SKU: ${product.sku} · ${product.category.toUpperCase()}`}
        maxWidth="2xl"
      >
        <div className="space-y-5 font-body">
          {/* Top Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <div className="text-[11px] uppercase text-slate-500 font-medium">Total Stock</div>
              <div
                className={`text-2xl font-bold font-display mt-0.5 ${
                  isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {formatNumber(totalStock)}{' '}
                <span className="text-xs font-normal text-slate-500 font-sans">{product.unitOfMeasure}</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase text-slate-500 font-medium">Available</div>
              <div className="text-2xl font-bold font-display text-slate-900 mt-0.5">
                {formatNumber(availableStock)}{' '}
                <span className="text-xs font-normal text-slate-500 font-sans">{product.unitOfMeasure}</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase text-slate-500 font-medium">Reserved</div>
              <div className="text-2xl font-bold font-display text-slate-600 mt-0.5">
                {formatNumber(reservedStock)}{' '}
                <span className="text-xs font-normal text-slate-500 font-sans">{product.unitOfMeasure}</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase text-slate-500 font-medium">Reorder Point</div>
              <div className="text-2xl font-bold font-display text-slate-800 mt-0.5">
                {formatNumber(product.reorderPoint)}{' '}
                <span className="text-xs font-normal text-slate-500 font-sans">{product.unitOfMeasure}</span>
              </div>
            </div>
          </div>

          {/* Barcode & Print Action Bar */}
          <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Barcode className="w-5 h-5 text-slate-600" strokeWidth={1.75} />
              <div>
                <div className="text-[11px] text-slate-400 font-medium">BARCODE</div>
                <div className="text-xs font-mono font-medium text-slate-800">
                  {product.barcode || '890100452011'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPrintOpen(true)}
              className="btn-secondary py-1 px-2.5 text-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
              <span>Print Pallet Label</span>
            </button>
          </div>

          {/* Stock by Location */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Warehouse className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                <span>Stock by Location</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {product.locationStock?.length || 0} Locations
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-medium">
                  <tr>
                    <th className="py-2 px-3.5">Warehouse / Location</th>
                    <th className="py-2 px-3.5 text-right">Physical Stock</th>
                    <th className="py-2 px-3.5 text-right">Reserved</th>
                    <th className="py-2 px-3.5 text-right">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-body">
                  {product.locationStock && product.locationStock.length > 0 ? (
                    product.locationStock.map((loc) => (
                      <tr key={loc.locationId} className="hover:bg-slate-50">
                        <td className="py-2 px-3.5">
                          <div className="font-medium text-slate-900">{loc.warehouseName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" strokeWidth={1.75} /> {loc.locationName}
                          </div>
                        </td>
                        <td className="py-2 px-3.5 text-right font-mono font-medium text-slate-900">
                          {loc.quantity} {product.unitOfMeasure}
                        </td>
                        <td className="py-2 px-3.5 text-right font-mono text-slate-500">
                          {loc.reserved || 0} {product.unitOfMeasure}
                        </td>
                        <td className="py-2 px-3.5 text-right font-mono font-semibold text-emerald-800">
                          {Math.max(0, loc.quantity - (loc.reserved || 0))} {product.unitOfMeasure}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 text-xs">
                        No inventory allocated.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Movement Timeline */}
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-700 mb-2">
              Recent Movement
            </div>
            <div className="space-y-1.5">
              {productMovements.length > 0 ? (
                productMovements.map((move) => (
                  <div
                    key={move.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[11px]">
                        {formatDateTime(move.timestamp)}
                      </span>
                      <Badge
                        status={
                          move.operationType === 'Receipt'
                            ? 'done'
                            : move.operationType === 'Delivery'
                            ? 'ready'
                            : 'waiting'
                        }
                        size="sm"
                      >
                        {move.operationType}
                      </Badge>
                      <span className="text-slate-600 text-xs">
                        {move.sourceLocationName} → {move.destinationLocationName}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-medium text-xs ${
                        move.quantityDelta > 0
                          ? 'text-emerald-700'
                          : move.quantityDelta < 0
                          ? 'text-rose-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {move.quantityDelta > 0 ? `+${move.quantityDelta}` : move.quantityDelta} {move.unitOfMeasure}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-3 text-center text-xs text-slate-400 bg-slate-50 rounded border border-slate-200">
                  No movements recorded.
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            {!isStaff && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('receipts');
                }}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-orange-600" strokeWidth={1.75} />
                <span>Create Receipt</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('internal_transfers');
              }}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
              <span>{isStaff ? 'Execute Transfer' : 'Transfer Stock'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('adjustments');
              }}
              className="btn-primary py-1.5 px-3 text-xs"
            >
              <ClipboardPenLine className="w-3.5 h-3.5 text-orange-400" strokeWidth={1.75} />
              <span>{isStaff ? 'Submit Count' : 'Stock Adjustment'}</span>
            </button>
          </div>
        </div>
      </Modal>

      <PrintLabelModal
        product={product}
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
      />
    </>
  );
};
