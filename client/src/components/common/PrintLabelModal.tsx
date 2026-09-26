'use client';

import React from 'react';
import { Modal } from './Modal';
import { Printer, Barcode, CheckCircle2, Copy } from 'lucide-react';
import { Product } from '@/types/inventory';
import { formatDateTime } from '@/lib/utils';

interface PrintLabelModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintLabelModal: React.FC<PrintLabelModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thermal Label Printer"
      subtitle="4×6 Inch Warehouse Bin & Pallet Tag"
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Printable Industrial Label Canvas */}
        <div
          id="printable-label"
          className="bg-white border-2 border-slate-900 rounded-lg p-5 font-mono text-slate-950 shadow-md space-y-4"
        >
          {/* Label Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
            <div>
              <div className="font-extrabold text-lg tracking-wider">STOCKSENSE LOGISTICS</div>
              <div className="text-[10px] text-slate-600">CERTIFIED INVENTORY TAG</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-xs">BIN / RACK</div>
              <div className="text-sm font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                {product.locationStock?.[0]?.locationName.split(' ')[0] || 'RACK-A'}
              </div>
            </div>
          </div>

          {/* Item Core Info */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">
              ARTICLE IDENTIFICATION
            </div>
            <div className="text-base font-black leading-tight mt-0.5">
              {product.name}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span className="font-bold text-slate-700">SKU:</span>
              <span className="text-base font-black tracking-wider bg-slate-100 px-2 py-0.5 border border-slate-300">
                {product.sku}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-600">{product.category}</span>
            </div>
          </div>

          {/* Simulated 1D Barcode Graphic */}
          <div className="pt-2 pb-1 border-y-2 border-slate-900 flex flex-col items-center justify-center">
            {/* Visual barcode stripes */}
            <div className="flex items-center justify-center gap-[2.5px] h-14 w-full px-2 overflow-hidden">
              {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 3, 4, 2, 1, 3, 1, 4, 2, 3].map((w, idx) => (
                <div
                  key={idx}
                  className="bg-black h-full"
                  style={{ width: `${w * 1.8}px` }}
                />
              ))}
            </div>
            <div className="text-xs font-mono font-bold tracking-[0.25em] text-slate-900 mt-1">
              *{product.barcode || product.sku}*
            </div>
          </div>

          {/* Logistics Properties Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <div className="text-[10px] text-slate-500">STANDARD UNIT:</div>
              <div className="font-bold">{product.unitOfMeasure.toUpperCase()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">REORDER THRESHOLD:</div>
              <div className="font-bold">{product.reorderPoint} {product.unitOfMeasure}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">ORIGIN SUPPLIER:</div>
              <div className="font-bold truncate">{product.supplierName || 'MetalWorks Ltd.'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">PRINT TIMESTAMP:</div>
              <div className="font-bold">{formatDateTime(new Date().toISOString())}</div>
            </div>
          </div>
        </div>

        {/* Print Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-sans font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-sans font-medium flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-orange-400" strokeWidth={1.75} />
            <span>Send to Label Printer</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
