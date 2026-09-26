'use client';

import React, { useState } from 'react';
import {
  UserRound,
  Shield,
  KeyRound,
  LogOut,
  Building2,
  Mail,
  Briefcase,
  CircleCheck,
  Clock,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/common/Badge';

export const ProfileView: React.FC = () => {
  const { currentUser, switchUserRole, updateCurrentUser } = useInventory();
  const { logout } = useAuth();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({ name, email });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="text-[11px] font-sans uppercase tracking-wider text-slate-500 font-semibold mb-1">
          Operator Credentials &amp; Access Roles
        </div>
        <h1 className="text-page-title text-slate-950">
          Operational Profile
        </h1>
        <p className="text-sm text-slate-600 font-sans mt-0.5">
          Access control, assigned terminal authority, and rapid persona simulation
        </p>
      </div>

      {/* Role Switcher Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-sans uppercase tracking-wider text-slate-500 font-semibold">
              Active Persona &amp; Privileges
            </div>
            <h3 className="text-base font-semibold text-slate-900 font-display mt-0.5">
              Current Mode: {currentUser.role === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff'}
            </h3>
          </div>
          <Badge variant={currentUser.role === 'inventory_manager' ? 'accent' : 'blue'}>
            {currentUser.role === 'inventory_manager' ? 'Full Procurement Rights' : 'Floor Execution Rights'}
          </Badge>
        </div>

        <p className="text-xs text-slate-600 font-sans leading-relaxed">
          Switch between target personas for instant role-based evaluation without logging out:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => switchUserRole('inventory_manager')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              currentUser.role === 'inventory_manager'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="font-sans font-semibold text-xs">Alex Vance (Manager)</div>
            <div className={`text-[11px] mt-1 font-sans ${currentUser.role === 'inventory_manager' ? 'text-slate-300' : 'text-slate-500'}`}>
              Manages incoming receipts, stock valuation, reorder rules, and facility transfers.
            </div>
          </button>

          <button
            type="button"
            onClick={() => switchUserRole('warehouse_staff')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              currentUser.role === 'warehouse_staff'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="font-sans font-semibold text-xs">Marcus Miller (Floor Staff)</div>
            <div className={`text-[11px] mt-1 font-sans ${currentUser.role === 'warehouse_staff' ? 'text-slate-300' : 'text-slate-500'}`}>
              Executes internal transfers, picks, packs cartons, and records physical cycle counts.
            </div>
          </button>
        </div>
      </div>

      {/* Operator Details Form */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="text-[11px] font-sans uppercase tracking-wider text-slate-500 font-semibold">
          Operator Attributes
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Operating Unit / Department
              </label>
              <input
                type="text"
                disabled
                value={currentUser.department}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Base Facility Node
              </label>
              <input
                type="text"
                disabled
                value={currentUser.role === 'warehouse_staff' ? (currentUser.assignedWarehouseName || 'Main Central Hub [WH-MAIN]') : 'All Warehouses (Corporate Scope)'}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {savedSuccess ? (
              <span className="flex items-center gap-1.5 text-xs font-sans text-emerald-700 font-medium">
                <CircleCheck className="w-4 h-4" strokeWidth={1.75} /> Profile attributes successfully persisted.
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-sans font-medium hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              Update Credentials
            </button>
          </div>
        </form>
      </div>

      {/* Security & Sign Out */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900 font-display">Session Authentication</div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Cryptographically signed JWT operator session with dual-factor OTP capabilities.
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.75} />
          <span>Terminate Session</span>
        </button>
      </div>
    </div>
  );
};
