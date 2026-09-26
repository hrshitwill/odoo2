'use client';

import React, { useState } from 'react';
import {
  Warehouse,
  MapPin,
  Plus,
  Layers,
  FolderTree,
  Package,
  Compass,
  CircleCheck,
  Trash2,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Modal } from '@/components/common/Modal';
import { CalibratedMeter } from '@/components/common/CapacityMeter';

export const WarehouseSettingsView: React.FC = () => {
  const { warehouses, products, addWarehouse, addLocation } = useInventory();

  // Create Warehouse Modal
  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whAddress, setWhAddress] = useState('');

  // Create Location Modal
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [targetWhId, setTargetWhId] = useState(warehouses[0]?.id || 'wh-main');
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locType, setLocType] = useState<'rack' | 'receiving' | 'staging' | 'floor' | 'shipping'>('rack');
  const [locCapacity, setLocCapacity] = useState('5000');

  const handleAddWh = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName || !whCode) return;
    addWarehouse({
      name: whName,
      code: whCode,
      address: whAddress || 'Terminal Logistics Facility',
    });
    setIsWhModalOpen(false);
    setWhName('');
    setWhCode('');
    setWhAddress('');
  };

  const handleAddLoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName || !locCode) return;
    addLocation({
      warehouseId: targetWhId,
      name: locName,
      code: locCode,
      type: locType,
      capacity: parseInt(locCapacity, 10) || 5000,
    });
    setIsLocModalOpen(false);
    setLocName('');
    setLocCode('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-[11px] font-sans uppercase tracking-wider text-slate-500 font-semibold mb-1">
            Facilities &amp; Topological Topology
          </div>
          <h1 className="text-page-title text-slate-950">
            Warehouse &amp; Location Architecture
          </h1>
          <p className="text-sm text-slate-600 font-sans mt-0.5">
            Configure multi-site hierarchy: Warehouses → Racks, Bays, Staging, Intake &amp; Dispatch docks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLocModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-sans font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
            <span>Add Sub-Location</span>
          </button>
          <button
            type="button"
            onClick={() => setIsWhModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-sans font-medium hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-orange-400" strokeWidth={1.75} />
            <span>Create Warehouse</span>
          </button>
        </div>
      </div>

      {/* Warehouse Hierarchy Cards */}
      <div className="space-y-6">
        {warehouses.map((wh) => {
          // Calculate warehouse total units
          let whTotalUnits = 0;
          products.forEach((p) => {
            (p.locationStock || []).forEach((ls) => {
              if (ls.warehouseId === wh.id) {
                whTotalUnits += ls.quantity;
              }
            });
          });

          return (
            <div
              key={wh.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
            >
              {/* Warehouse Header Bar */}
              <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Warehouse className="w-4 h-4 text-orange-400" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-900 font-display">{wh.name}</h2>
                      <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200">
                        {wh.code}
                      </span>
                      {wh.isMain && (
                        <span className="text-[11px] font-sans font-medium px-2 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Primary Hub
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-sans text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
                      <span>{wh.address}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-sans">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Total Stored</div>
                    <div className="font-semibold text-slate-900 font-display text-sm">{whTotalUnits} <span className="font-sans font-normal text-xs text-slate-500">Units</span></div>
                  </div>
                  <div className="text-right pl-4 border-l border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Sub-Locations</div>
                    <div className="font-semibold text-slate-900 font-display text-sm">{wh.locations.length} <span className="font-sans font-normal text-xs text-slate-500">Bays</span></div>
                  </div>
                </div>
              </div>

              {/* Sub-Locations Grid */}
              <div className="p-5">
                <div className="text-[11px] font-sans uppercase tracking-wider text-slate-500 mb-3 font-semibold">
                  Topological Structure &amp; Storage Zones
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {wh.locations.map((loc) => {
                    // Count items in this location
                    let locStockUnits = 0;
                    products.forEach((p) => {
                      const found = (p.locationStock || []).find((l) => l.locationId === loc.id);
                      if (found) locStockUnits += found.quantity;
                    });

                    const capacity = loc.capacity || 5000;
                    const percent = Math.min(100, Math.round((locStockUnits / capacity) * 100));

                    return (
                      <div
                        key={loc.id}
                        className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-xs text-slate-900 font-sans truncate max-w-[140px]">
                              {loc.name}
                            </div>
                            <span className="text-[11px] font-mono text-slate-500">
                              {loc.code} · {loc.type.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-medium px-1 rounded bg-white text-slate-700 border border-slate-200">
                            {percent}%
                          </span>
                        </div>

                        {/* Capacity meter mini bar */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent > 85 ? 'bg-amber-500' : percent > 50 ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[11px] font-sans text-slate-500 pt-1">
                          <span>Occupancy:</span>
                          <span className="font-medium text-slate-800 font-mono">
                            {locStockUnits} / {capacity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Warehouse Modal */}
      <Modal
        isOpen={isWhModalOpen}
        onClose={() => setIsWhModalOpen(false)}
        title="Create Warehouse Node"
        subtitle="Physical Facility Setup"
        maxWidth="md"
      >
        <form onSubmit={handleAddWh} className="space-y-4">
          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Facility Name *
            </label>
            <input
              type="text"
              required
              value={whName}
              onChange={(e) => setWhName(e.target.value)}
              placeholder="e.g. South Pacific Distribution Center"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Warehouse Code *
            </label>
            <input
              type="text"
              required
              value={whCode}
              onChange={(e) => setWhCode(e.target.value.toUpperCase())}
              placeholder="e.g. WH-SOUTH"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Geographic Address
            </label>
            <input
              type="text"
              value={whAddress}
              onChange={(e) => setWhAddress(e.target.value)}
              placeholder="e.g. Pier 14, Southern Maritime Logistic Zone"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsWhModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-sans font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-sans font-medium hover:bg-slate-800 shadow-xs cursor-pointer"
            >
              Provision Warehouse
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Location Modal */}
      <Modal
        isOpen={isLocModalOpen}
        onClose={() => setIsLocModalOpen(false)}
        title="Add Sub-Location / Rack"
        subtitle="Storage Topology Hierarchy"
        maxWidth="md"
      >
        <form onSubmit={handleAddLoc} className="space-y-4">
          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Parent Warehouse *
            </label>
            <select
              value={targetWhId}
              onChange={(e) => setTargetWhId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} [{w.code}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Location / Bay Name *
            </label>
            <input
              type="text"
              required
              value={locName}
              onChange={(e) => setLocName(e.target.value)}
              placeholder="e.g. Heavy Rack D (Alloys)"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Bay Code *
              </label>
              <input
                type="text"
                required
                value={locCode}
                onChange={(e) => setLocCode(e.target.value.toUpperCase())}
                placeholder="e.g. RACK-D"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Zone Type
              </label>
              <select
                value={locType}
                onChange={(e) => setLocType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="rack">Racking Bay</option>
                <option value="receiving">Intake Receiving</option>
                <option value="staging">Staging Area</option>
                <option value="floor">Production Floor</option>
                <option value="shipping">Outbound Shipping</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Storage Capacity Limit (Units)
            </label>
            <input
              type="number"
              value={locCapacity}
              onChange={(e) => setLocCapacity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsLocModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-sans font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-sans font-medium hover:bg-slate-800 shadow-xs cursor-pointer"
            >
              Add Location to Warehouse
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
