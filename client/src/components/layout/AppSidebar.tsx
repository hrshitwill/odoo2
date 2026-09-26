'use client';

import React from 'react';
import {
  LayoutDashboard,
  Package,
  Tags,
  RotateCcw,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  ClipboardPenLine,
  History,
  Warehouse,
  UserRound,
  LogOut,
  ChevronRight,
  Scan,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventory } from '@/context/InventoryContext';
import { useAuth } from '@/context/AuthContext';

export type NavigationTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'reordering_rules'
  | 'receipts'
  | 'delivery_orders'
  | 'internal_transfers'
  | 'adjustments'
  | 'move_history'
  | 'warehouse_settings'
  | 'staff_management'
  | 'profile';

interface AppSidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenScanner?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenScanner,
}) => {
  const { kpis, scopedKpis, scopedReceipts, scopedDeliveries, scopedTransfers, scopedLowStockAlerts, currentUser, switchUserRole } = useInventory();
  const { logout } = useAuth();

  const isStaff = currentUser.role === 'warehouse_staff';

  const pendingReceiptsCount = isStaff
    ? scopedReceipts.filter(r => r.status === 'draft' || r.status === 'waiting' || r.status === 'ready').length
    : kpis.pendingReceiptsCount;

  const pendingDeliveriesCount = isStaff
    ? scopedDeliveries.filter(d => d.status === 'draft' || d.status === 'waiting' || d.status === 'ready').length
    : kpis.pendingDeliveriesCount;

  const scheduledTransfersCount = isStaff
    ? scopedTransfers.filter(t => t.status === 'draft' || t.status === 'waiting' || t.status === 'ready').length
    : kpis.scheduledTransfersCount;

  const allNavGroups = [
    {
      group: 'WORK QUEUE',
      items: [
        {
          id: 'overview' as NavigationTab,
          label: isStaff ? "Today's Work Queue" : 'Overview',
          icon: LayoutDashboard,
          badge: null,
        },
      ],
    },
    {
      group: isStaff ? 'STOCK VISIBILITY' : 'MASTER DATA',
      items: [
        {
          id: 'products' as NavigationTab,
          label: isStaff ? 'Warehouse Stock' : 'Products',
          icon: Package,
          badge: (isStaff ? scopedLowStockAlerts.length : kpis.lowStockCount) > 0 
            ? `${isStaff ? scopedLowStockAlerts.length : kpis.lowStockCount}` 
            : null,
          badgeVariant: 'warning',
        },
        {
          id: 'categories' as NavigationTab,
          label: 'Categories',
          icon: Tags,
          badge: null,
          managerOnly: true,
        },
        {
          id: 'reordering_rules' as NavigationTab,
          label: 'Reordering Rules',
          icon: RotateCcw,
          badge: null,
          managerOnly: true,
        },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        {
          id: 'receipts' as NavigationTab,
          label: isStaff ? 'Assigned Receipts' : 'Receipts',
          icon: ArrowDownToLine,
          badge: pendingReceiptsCount > 0 ? `${pendingReceiptsCount}` : null,
          badgeVariant: 'accent',
        },
        {
          id: 'delivery_orders' as NavigationTab,
          label: isStaff ? 'Deliveries & Picking' : 'Delivery Orders',
          icon: ArrowUpFromLine,
          badge: pendingDeliveriesCount > 0 ? `${pendingDeliveriesCount}` : null,
          badgeVariant: 'neutral',
        },
        {
          id: 'internal_transfers' as NavigationTab,
          label: isStaff ? 'Physical Transfers' : 'Internal Transfers',
          icon: ArrowRightLeft,
          badge: scheduledTransfersCount > 0 ? `${scheduledTransfersCount}` : null,
          badgeVariant: 'neutral',
        },
        {
          id: 'adjustments' as NavigationTab,
          label: isStaff ? 'Physical Counts' : 'Adjustments',
          icon: ClipboardPenLine,
          badge: null,
        },
        {
          id: 'move_history' as NavigationTab,
          label: isStaff ? 'My Activity' : 'Stock Ledger',
          icon: History,
          badge: null,
        },
      ],
    },
    {
      group: 'SETTINGS',
      managerOnly: true,
      items: [
        {
          id: 'warehouse_settings' as NavigationTab,
          label: 'Facilities',
          icon: Warehouse,
          badge: null,
        },
        {
          id: 'staff_management' as NavigationTab,
          label: 'Staff & Personnel',
          icon: Users,
          badge: null,
        },
      ],
    },
    {
      group: 'PROFILE',
      items: [
        {
          id: 'profile' as NavigationTab,
          label: 'My Profile',
          icon: UserRound,
          badge: null,
        },
      ],
    },
  ];

  const navGroups = allNavGroups
    .filter((g) => !(isStaff && g.managerOnly))
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => !(isStaff && (item as any).managerOnly)),
    }));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Identity Header */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white shrink-0">
            <Package className="w-4 h-4 text-orange-500" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base tracking-tight text-slate-900">
              STOCKSENSE
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
              Inventory Management
            </span>
          </div>
        </div>
      </div>

      {/* Quick Scanner Action */}
      {onOpenScanner && (
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={onOpenScanner}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-200 flex items-center justify-center gap-2 text-xs font-medium transition-colors"
          >
            <Scan className="w-4 h-4 text-orange-600" strokeWidth={1.75} />
            <span>Barcode Scanner</span>
          </button>
        </div>
      )}

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.group}>
            <div className="px-2 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400 font-sans">
              {group.group}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-2 rounded text-sm transition-colors group cursor-pointer text-left',
                      isActive
                        ? 'bg-slate-900 text-white font-medium shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={cn(
                          'w-[18px] h-[18px] shrink-0 transition-colors',
                          isActive ? 'text-orange-400' : 'text-slate-500 group-hover:text-slate-800'
                        )}
                        strokeWidth={1.75}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span
                          className={cn(
                            'text-[11px] font-mono font-medium px-1.5 py-0.2 rounded border',
                            isActive
                              ? 'bg-orange-600 text-white border-orange-500'
                              : item.badgeVariant === 'warning'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : item.badgeVariant === 'accent'
                              ? 'bg-orange-50 text-orange-800 border-orange-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Operator Session Info Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-7 h-7 rounded text-white flex items-center justify-center text-xs font-mono font-medium shrink-0 ${isStaff ? 'bg-blue-600' : 'bg-slate-900'}`}>
              {currentUser.avatar || (isStaff ? 'ST' : 'MG')}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-900 truncate">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate capitalize font-medium">
                {isStaff ? 'Warehouse Staff' : 'Inventory Manager'}
              </div>
              <div className="text-[10px] text-slate-400 truncate font-mono">
                {isStaff ? (currentUser.assignedWarehouseName || 'Main Central Hub') : 'All Facilities'}
              </div>
            </div>
          </div>

          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
              isStaff
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}
          >
            {isStaff ? 'STAFF' : 'MGR'}
          </span>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full mt-2 flex items-center justify-center gap-1.5 py-1 text-xs text-slate-500 hover:text-rose-600 rounded transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );
};
