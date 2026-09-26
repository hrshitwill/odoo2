'use client';

import React, { useState, useEffect } from 'react';
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
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Mail,
  Lock,
  UserRound,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { useAuth, RegisteredOperator } from '@/context/AuthContext';
import { UserRole } from '@/types/inventory';
import { Modal } from '@/components/common/Modal';
import { CalibratedMeter } from '@/components/common/CapacityMeter';

export const WarehouseSettingsView: React.FC = () => {
  const { warehouses, products, addWarehouse, addLocation } = useInventory();
  const { user, provisionUser, fetchRegisteredOperators, revokeOperator } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'facilities' | 'operators'>('facilities');

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

  // Operator Provisioning State (Manager Only)
  const [operators, setOperators] = useState<RegisteredOperator[]>([]);
  const [isLoadingOperators, setIsLoadingOperators] = useState(false);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [newOpName, setNewOpName] = useState('');
  const [newOpEmail, setNewOpEmail] = useState('');
  const [newOpPassword, setNewOpPassword] = useState('');
  const [newOpRole, setNewOpRole] = useState<UserRole>('warehouse_staff');
  const [statusAlert, setStatusAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load operators from API when switching to operators tab
  const loadOperators = async () => {
    setIsLoadingOperators(true);
    const list = await fetchRegisteredOperators();
    setOperators(list);
    setIsLoadingOperators(false);
  };

  useEffect(() => {
    if (activeTab === 'operators') {
      loadOperators();
    }
  }, [activeTab]);

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

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName || !newOpEmail || !newOpPassword) return;

    if (newOpPassword.length < 6) {
      setStatusAlert({
        type: 'error',
        text: 'Initial security password must be at least 6 characters.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusAlert(null);

    const res = await provisionUser(newOpName, newOpEmail, newOpPassword, newOpRole);
    setIsSubmitting(false);

    if (res.success) {
      setStatusAlert({
        type: 'success',
        text: `Operator ${newOpName} provisioned! They can now log in using ${newOpEmail}.`,
      });
      setIsProvisionModalOpen(false);
      setNewOpName('');
      setNewOpEmail('');
      setNewOpPassword('');
      setNewOpRole('warehouse_staff');
      loadOperators();
    } else {
      setStatusAlert({
        type: 'error',
        text: res.message || 'Failed to provision operator account.',
      });
    }
  };

  const handleRevokeOperator = async (op: RegisteredOperator) => {
    if (confirm(`Are you sure you want to revoke warehouse access for ${op.name} (${op.email})?`)) {
      const res = await revokeOperator(op.id);
      if (res.success) {
        setStatusAlert({
          type: 'success',
          text: `Revoked access for ${op.email}.`,
        });
        loadOperators();
      } else {
        setStatusAlert({
          type: 'error',
          text: res.message || 'Failed to revoke operator access.',
        });
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-[11px] font-sans uppercase tracking-wider text-slate-500 font-semibold mb-1">
            Facilities, Security &amp; Access Control
          </div>
          <h1 className="text-page-title text-slate-950">
            Warehouse Architecture &amp; Personnel
          </h1>
          <p className="text-sm text-slate-600 font-sans mt-0.5">
            Manage multi-site topology, storage bays, and authorized operator access credentials
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'facilities' ? (
            <>
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
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsProvisionModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-sans font-medium transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-white" strokeWidth={1.75} />
              <span>Provision New Operator</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('facilities')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-sans font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'facilities'
              ? 'border-orange-600 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Warehouse className="w-4 h-4 text-slate-600" />
          <span>Facilities &amp; Sub-Locations ({warehouses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operators')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-sans font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'operators'
              ? 'border-orange-600 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-slate-600" />
          <span>Operator Directory &amp; Warehouse Access</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] font-mono text-slate-700 font-bold">
            Manager Only
          </span>
        </button>
      </div>

      {/* Global Status Alert */}
      {statusAlert && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-sans flex items-start gap-2.5 ${
            statusAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {statusAlert.type === 'success' ? (
            <CircleCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{statusAlert.text}</div>
          <button
            type="button"
            onClick={() => setStatusAlert(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: Facilities & Hierarchy */}
      {activeTab === 'facilities' && (
        <div className="space-y-6">
          {warehouses.map((wh) => {
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
                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
                      {wh.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 font-display">
                          {wh.name}
                        </h2>
                        {wh.isMain && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                            Primary Hub
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-sans mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{wh.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs font-sans">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase tracking-wider block">
                        Sub-Zones
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {wh.locations?.length || 0} locations
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase tracking-wider block">
                        Units On-Hand
                      </span>
                      <span className="font-mono font-bold text-orange-600">
                        {whTotalUnits.toLocaleString()} units
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-Locations Grid */}
                <div className="p-5">
                  <div className="text-[11px] font-sans font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                    <span>Configured Storage Locations &amp; Bays</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {wh.locations?.map((loc) => {
                      let locUnits = 0;
                      products.forEach((p) => {
                        (p.locationStock || []).forEach((ls) => {
                          if (ls.locationId === loc.id) {
                            locUnits += ls.quantity;
                          }
                        });
                      });

                      const maxCap = loc.capacity || 5000;
                      const fillPct = Math.min(100, Math.round((locUnits / maxCap) * 100));

                      return (
                        <div
                          key={loc.id}
                          className="p-3.5 bg-slate-50/60 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono font-bold text-xs text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {loc.code}
                            </span>
                            <span className="text-[10px] font-sans uppercase tracking-wider font-semibold text-slate-400">
                              {loc.type}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-800 truncate mb-2">
                            {loc.name}
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-mono text-slate-500">
                              <span>Occupancy</span>
                              <span className="font-bold text-slate-800">
                                {locUnits} / {maxCap} ({fillPct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  fillPct > 90
                                    ? 'bg-rose-500'
                                    : fillPct > 70
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>
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
      )}

      {/* TAB 2: Operator Directory & Access Control (Manager Only) */}
      {activeTab === 'operators' && (
        <div className="space-y-6">
          {/* Policy Overview Card */}
          <div className="p-5 bg-slate-900 text-white rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0" />
                <h3 className="text-sm font-bold font-display tracking-wide">
                  Central Warehouse Access Control Policy
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-2xl">
                Public self-registration is strictly disabled. Only authorized <strong>Inventory Managers</strong> have administrative privileges to provision new operator credentials and grant warehouse access.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={loadOperators}
                disabled={isLoadingOperators}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-sans transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOperators ? 'animate-spin' : ''}`} />
                <span>Sync Directory</span>
              </button>
              <button
                type="button"
                onClick={() => setIsProvisionModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-sans font-medium transition-colors shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Provision Operator</span>
              </button>
            </div>
          </div>

          {/* Operators List Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                  Active System Operators ({operators.length})
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-sans">
                Stored securely in MongoDB with bcrypt hashing
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Role &amp; Permissions</th>
                    <th className="py-3 px-4">Access Scope</th>
                    <th className="py-3 px-4">Provisioned</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {operators.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {isLoadingOperators ? 'Loading operator directory...' : 'No operators found in directory.'}
                      </td>
                    </tr>
                  ) : (
                    operators.map((op) => {
                      const isManager = op.role === 'INVENTORY_MANAGER';
                      const isCurrentUser = user?.email.toLowerCase() === op.email.toLowerCase();

                      return (
                        <tr key={op.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isManager
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {op.name
                                  .split(' ')
                                  .map((p) => p[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block">{op.name}</span>
                                {isCurrentUser && (
                                  <span className="text-[10px] text-emerald-600 font-medium font-sans">
                                    ● Current Session
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-700">
                            {op.email}
                          </td>

                          <td className="py-3.5 px-4">
                            {isManager ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-sans font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                                <Shield className="w-3 h-3 text-orange-600" />
                                <span>Inventory Manager</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-sans font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                <UserRound className="w-3 h-3 text-blue-600" />
                                <span>Warehouse Staff</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            {isManager ? (
                              <span className="font-medium text-slate-900">
                                Full System &amp; All Warehouses
                              </span>
                            ) : (
                              <span className="text-slate-500">
                                Operations &amp; Scanning (Main Central Hub)
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {op.createdAt ? new Date(op.createdAt).toLocaleDateString() : 'System Seeded'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isCurrentUser ? (
                              <span className="text-[11px] text-slate-400 italic">Active Self</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRevokeOperator(op)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Revoke</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Create Warehouse */}
      <Modal
        isOpen={isWhModalOpen}
        onClose={() => setIsWhModalOpen(false)}
        title="Establish New Facility / Warehouse"
      >
        <form onSubmit={handleAddWh} className="space-y-4">
          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Facility Official Name *
            </label>
            <input
              type="text"
              required
              value={whName}
              onChange={(e) => setWhName(e.target.value)}
              placeholder="e.g. Northern Cold Chain Terminal"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Topological Site Code (2-4 uppercase chars) *
            </label>
            <input
              type="text"
              required
              maxLength={5}
              value={whCode}
              onChange={(e) => setWhCode(e.target.value.toUpperCase())}
              placeholder="e.g. WH-NORTH"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Physical Street / Dock Address
            </label>
            <input
              type="text"
              value={whAddress}
              onChange={(e) => setWhAddress(e.target.value)}
              placeholder="e.g. Sector 14, Logistics Boulevard"
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
              Register Facility
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Create Sub-Location */}
      <Modal
        isOpen={isLocModalOpen}
        onClose={() => setIsLocModalOpen(false)}
        title="Add Storage Location / Racking Bay"
      >
        <form onSubmit={handleAddLoc} className="space-y-4">
          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Parent Facility *
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

      {/* MODAL 3: Provision New Operator (Manager Only) */}
      <Modal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        title="Provision New Warehouse Operator"
      >
        <form onSubmit={handleProvisionSubmit} className="space-y-4">
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-950 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Manager Privilege:</strong> As an Inventory Manager, you are provisioning an official operator account. The operator can log in immediately using these credentials.
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Operator Full Name *
            </label>
            <div className="relative">
              <UserRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={newOpName}
                onChange={(e) => setNewOpName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Official Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={newOpEmail}
                onChange={(e) => setNewOpEmail(e.target.value)}
                placeholder="s.connor@stocksense.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Initial Security Password * (min 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={newOpPassword}
                onChange={(e) => setNewOpPassword(e.target.value)}
                placeholder="Assign strong password"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Assigned Operational Role &amp; Permissions *
            </label>
            <select
              value={newOpRole}
              onChange={(e) => setNewOpRole(e.target.value as UserRole)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="warehouse_staff">Warehouse Staff (Picking, Packing, Counting &amp; Barcode Scanner)</option>
              <option value="inventory_manager">Inventory Manager (Full Warehouse Access, Catalog &amp; User Provisioning)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsProvisionModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-sans font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg text-xs font-sans font-medium shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Grant Warehouse Access</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
