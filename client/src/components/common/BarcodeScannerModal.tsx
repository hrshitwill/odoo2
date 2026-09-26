'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import {
  Scan,
  Barcode,
  Search,
  CircleCheck,
  Package,
  Layers,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Product } from '@/types/inventory';
import { formatNumber } from '@/lib/utils';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onProductFound,
}) => {
  const { products, getTotalStockForProduct } = useInventory();
  const [manualCode, setManualCode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const simulateScan = (product: Product) => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedProduct(product);
    }, 600);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode) return;
    const clean = manualCode.trim().toLowerCase();
    const found = products.find(
      (p) =>
        p.sku.toLowerCase() === clean ||
        (p.barcode && p.barcode.toLowerCase() === clean) ||
        p.name.toLowerCase().includes(clean)
    );
    if (found) {
      setScannedProduct(found);
    }
  };

  const handleConfirm = () => {
    if (scannedProduct) {
      onProductFound(scannedProduct);
      onClose();
      setScannedProduct(null);
      setManualCode('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Optical Barcode Scanner"
      subtitle="Handheld Logistics Terminal Emulator"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Terminal Screen Viewport */}
        <div className="relative bg-slate-950 text-emerald-400 p-5 rounded-xl border-2 border-slate-800 shadow-inner overflow-hidden font-mono">
          {/* Laser scanning beam line */}
          <div className="absolute inset-x-0 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-laser pointer-events-none" />

          {/* Scanner Header */}
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
              <span>RF FREQ: 915 MHz · DOCK TERMINAL 04</span>
            </div>
            <span className="text-emerald-400 font-medium">READY</span>
          </div>

          {/* Reticle / Aiming Target */}
          <div className="border border-dashed border-emerald-500/40 rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-2">
            <Barcode className="w-16 h-10 text-emerald-400 opacity-80" strokeWidth={1.5} />
            <div className="text-xs text-emerald-300 font-medium tracking-wider">
              {isScanning ? 'DECODING OPTICAL 1D/2D SYMBOLOGY...' : 'ALIGN LASER ACROSS PRODUCT BARCODE'}
            </div>
            <div className="text-[11px] text-slate-400">
              Compatible: Code-128, GS1 Databar, QR Matrix
            </div>
          </div>
        </div>

        {/* Quick Click Sample Barcodes for Warehouse Operators */}
        <div className="space-y-2">
          <div className="text-xs font-sans uppercase tracking-wider text-slate-500 font-medium">
            Simulate Aim &amp; Scan on Warehouse Tags:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {products.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => simulateScan(p)}
                className="p-2.5 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-lg text-left text-xs font-sans transition-all group shadow-2xs cursor-pointer"
              >
                <div className="font-mono font-medium text-slate-900 group-hover:text-orange-600 truncate">
                  {p.sku}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{p.name}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                  <Scan className="w-3 h-3 text-slate-400" strokeWidth={1.75} /> {p.barcode}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Code Input Option */}
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <div className="text-xs font-sans uppercase tracking-wider text-slate-500 font-medium">
            Or Key-in SKU / Barcode Manually:
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. STL-001 or 890100452011"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer"
            >
              Lookup
            </button>
          </div>
        </form>

        {/* Scanned Result Banner */}
        {scannedProduct && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-900 flex items-center gap-1.5">
                <CircleCheck className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
                Valid Item Identified
              </span>
              <span className="text-xs font-mono font-medium text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                {scannedProduct.sku}
              </span>
            </div>

            <div className="text-sm font-semibold text-slate-900 font-display">
              {scannedProduct.name}
            </div>

            <div className="flex justify-between text-xs text-slate-600">
              <span>On-Hand Inventory:</span>
              <strong className="text-slate-900 font-mono">
                {formatNumber(getTotalStockForProduct(scannedProduct))} {scannedProduct.unitOfMeasure}
              </strong>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-sans font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span>Open Detailed Article Sheet</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
