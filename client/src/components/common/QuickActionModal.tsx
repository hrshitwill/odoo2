'use client';

import React from 'react';
import { Modal } from '@/components/common/Modal';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  ClipboardPenLine,
  Package,
  ArrowRight,
  Scan,
} from 'lucide-react';
import { NavigationTab } from '@/components/layout/AppSidebar';
import { useInventory } from '@/context/InventoryContext';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
  onOpenScanner?: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenScanner,
}) => {
  const { currentUser } = useInventory();
  const isStaff = currentUser.role === 'warehouse_staff';

  const actions = [
    {
      title: 'Inbound PO & Goods Receipt',
      desc: 'Process supplier freight delivery, verify bill of lading & rack inventory.',
      tab: 'receipts' as NavigationTab,
      icon: ArrowDownToLine,
    },
    {
      title: 'Outbound Delivery Shipment',
      desc: 'Pick, pack & validate sales orders, decrementing rack inventory upon dispatch.',
      tab: 'delivery_orders' as NavigationTab,
      icon: ArrowUpFromLine,
    },
    {
      title: 'Internal Stock Transfer',
      desc: 'Relocate stock between warehouses or racks without altering company total.',
      tab: 'internal_transfers' as NavigationTab,
      icon: ArrowRightLeft,
    },
    {
      title: 'Physical Cycle Count Adjustment',
      desc: isStaff
        ? 'Submit counted units for manager review and reconciliation.'
        : 'Reconcile counted units vs. system records and report write-offs / scrap.',
      tab: 'adjustments' as NavigationTab,
      icon: ClipboardPenLine,
    },
    {
      title: 'Master Article Registration',
      desc: 'Index a new product, assign barcode, reorder point & initial balance.',
      tab: 'products' as NavigationTab,
      icon: Package,
      managerOnly: true,
    },
  ];

  const visibleActions = isStaff ? actions.filter(a => !a.managerOnly) : actions;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Warehouse Operations Menu"
      subtitle={isStaff ? "Assigned Operational Procedures" : "Select Dispatch or Movement Procedure"}
      maxWidth="lg"
    >
      <div className="space-y-2.5">
        {onOpenScanner && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenScanner();
            }}
            className="w-full p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-between text-left transition-all shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-orange-600 flex items-center justify-center shrink-0">
                <Scan className="w-4 h-4 text-white" strokeWidth={1.75} />
              </div>
              <div>
                <h4 className="font-semibold text-sm font-sans text-white">
                  Launch Optical Barcode Gun (RF Scanner)
                </h4>
                <p className="text-xs text-slate-300 font-sans mt-0.5">
                  Point laser at physical tag to look up item, verify balance, or print replacement tag.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-orange-400 shrink-0" strokeWidth={1.75} />
          </button>
        )}

        {visibleActions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.title}
              type="button"
              onClick={() => {
                onClose();
                onNavigate(act.tab);
              }}
              className="w-full p-3.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 rounded-xl flex items-center justify-between text-left transition-all group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                  <Icon className="w-4 h-4 text-slate-700" strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 font-sans group-hover:text-slate-950 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-sans mt-0.5 max-w-md">
                    {act.desc}
                  </p>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" strokeWidth={1.75} />
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
