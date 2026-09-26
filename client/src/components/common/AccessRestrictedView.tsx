'use client';

import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, Warehouse } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { NavigationTab } from '@/components/layout/AppSidebar';

interface AccessRestrictedViewProps {
  onNavigate: (tab: NavigationTab) => void;
  restrictedResourceName?: string;
  requiredRole?: string;
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  onNavigate,
  restrictedResourceName = 'Administrative Resource',
  requiredRole = 'Inventory Manager',
}) => {
  const { currentUser } = useInventory();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-body select-none">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6">
        {/* Visual Guard Badge */}
        <div className="mx-auto w-14 h-14 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
          <ShieldAlert className="w-7 h-7" strokeWidth={1.75} />
        </div>

        {/* Header & Status */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-sans font-semibold uppercase tracking-wider text-rose-600">
            HTTP 403 · Access Restricted
          </div>
          <h1 className="text-xl font-semibold text-slate-900 font-display">
            Restricted Operational Area
          </h1>
          <p className="text-xs text-slate-500 font-sans leading-relaxed">
            You do not have administrative clearance to access{' '}
            <span className="font-semibold text-slate-900">{restrictedResourceName}</span>.
          </p>
        </div>

        {/* RBAC Credential Context Box */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs font-sans space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span>Authenticated User:</span>
            <span className="font-medium text-slate-900">{currentUser.name}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Operational Role:</span>
            <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Warehouse Staff
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Assigned Facility:</span>
            <span className="font-medium text-slate-900 flex items-center gap-1">
              <Warehouse className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              {currentUser.assignedWarehouseName || 'Main Central Hub'}
            </span>
          </div>
        </div>

        {/* Explanatory Policy */}
        <p className="text-[11px] text-slate-400 font-sans leading-normal">
          Warehouse Staff accounts are specialized for floor execution (receipt intake, item picking, carton packing, rack transfers, and cycle counts). Master articles, categories, reordering formulas, and facility architecture are managed exclusively by Inventory Managers.
        </p>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-sans font-medium flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400" strokeWidth={1.75} />
            <span>Return to Operations Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
