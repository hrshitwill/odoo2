'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { AuthView } from '@/components/auth/AuthView';
import { AppSidebar, NavigationTab } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { ProductsView } from '@/components/products/ProductsView';
import { CategoriesView } from '@/components/products/CategoriesView';
import { ReceiptsView } from '@/components/operations/ReceiptsView';
import { DeliveryOrdersView } from '@/components/operations/DeliveryOrdersView';
import { InternalTransfersView } from '@/components/operations/InternalTransfersView';
import { AdjustmentsView } from '@/components/operations/AdjustmentsView';
import { StockLedgerView } from '@/components/operations/StockLedgerView';
import { ReorderingRulesView } from '@/components/rules/ReorderingRulesView';
import { WarehouseSettingsView } from '@/components/settings/WarehouseSettingsView';
import { ProfileView } from '@/components/profile/ProfileView';
import { QuickActionModal } from '@/components/common/QuickActionModal';
import { BarcodeScannerModal } from '@/components/common/BarcodeScannerModal';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';
import { StaffDashboardView } from '@/components/dashboard/StaffDashboardView';
import { AccessRestrictedView } from '@/components/common/AccessRestrictedView';
import { useInventory } from '@/context/InventoryContext';
import { Product } from '@/types/inventory';
import { Menu, X } from 'lucide-react';

const MANAGER_ONLY_TABS: NavigationTab[] = [
  'products',
  'categories',
  'reordering_rules',
  'warehouse_settings',
];

export default function StockSenseApp() {
  const { isAuthenticated } = useAuth();
  const { currentUser } = useInventory();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Scanned Product Drawer state
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [isScannedDetailOpen, setIsScannedDetailOpen] = useState(false);

  // Sync tab with URL search/hash on mount for direct navigation support
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as NavigationTab | null;
      const hashParam = window.location.hash.replace('#', '') as NavigationTab;
      const target = tabParam || (hashParam as NavigationTab);
      if (target) {
        setCurrentTab(target);
      }
    }
  }, []);

  // Sync warehouse for staff
  React.useEffect(() => {
    if (currentUser.role === 'warehouse_staff' && currentUser.warehouseId) {
      setSelectedWarehouseId(currentUser.warehouseId);
    }
  }, [currentUser]);

  if (!isAuthenticated) {
    return <AuthView />;
  }

  const handleProductFound = (product: Product) => {
    setScannedProduct(product);
    setIsScannedDetailOpen(true);
  };

  const renderActiveView = () => {
    // RBAC ROUTE GUARD: Prevent Warehouse Staff from accessing Manager-only views
    if (currentUser.role === 'warehouse_staff' && MANAGER_ONLY_TABS.includes(currentTab)) {
      return (
        <AccessRestrictedView
          requiredRole="Inventory Manager"
          onNavigate={(tab) => setCurrentTab(tab)}
        />
      );
    }

    switch (currentTab) {
      case 'overview':
        if (currentUser.role === 'warehouse_staff') {
          return <StaffDashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
        }
        return (
          <DashboardView
            onNavigate={(tab) => setCurrentTab(tab)}
            selectedWarehouseId={selectedWarehouseId}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        );
      case 'products':
        return (
          <ProductsView
            onNavigate={(tab) => setCurrentTab(tab)}
            selectedWarehouseId={selectedWarehouseId}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        );
      case 'categories':
        return <CategoriesView onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'receipts':
        return <ReceiptsView />;
      case 'delivery_orders':
        return <DeliveryOrdersView />;
      case 'internal_transfers':
        return <InternalTransfersView />;
      case 'adjustments':
        return <AdjustmentsView />;
      case 'move_history':
        return <StockLedgerView />;
      case 'reordering_rules':
        return <ReorderingRulesView onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'warehouse_settings':
        return <WarehouseSettingsView />;
      case 'profile':
        return <ProfileView />;
      default:
        if (currentUser.role === 'warehouse_staff') {
          return <StaffDashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
        }
        return (
          <DashboardView
            onNavigate={(tab) => setCurrentTab(tab)}
            selectedWarehouseId={selectedWarehouseId}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 antialiased font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <AppSidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onOpenScanner={() => setIsScannerOpen(true)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2 }}
              className="relative w-72 bg-white z-10 flex flex-col h-full shadow-2xl"
            >
              <div className="absolute right-2 top-3">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <AppSidebar
                currentTab={currentTab}
                onSelectTab={(tab) => {
                  setCurrentTab(tab);
                  setIsMobileSidebarOpen(false);
                }}
                onOpenScanner={() => {
                  setIsMobileSidebarOpen(false);
                  setIsScannerOpen(true);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#F4F6F8]">
        {/* Header */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-3.5 text-slate-700 hover:bg-slate-200/50"
            aria-label="Open navigation"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <AppHeader
              onNavigate={(tab) => setCurrentTab(tab)}
              selectedWarehouseId={selectedWarehouseId}
              onSelectWarehouse={setSelectedWarehouseId}
              onOpenQuickAction={() => setIsQuickActionOpen(true)}
              onOpenScanner={() => setIsScannerOpen(true)}
            />
          </div>
        </div>

        {/* View Content Body with Motion Transition */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-7">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Quick Action Operation Selector Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Handheld Barcode Scanner Simulator */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onProductFound={handleProductFound}
      />

      {/* Product Detail Modal for Scanned Item */}
      <ProductDetailModal
        product={scannedProduct}
        isOpen={isScannedDetailOpen}
        onClose={() => setIsScannedDetailOpen(false)}
        onNavigate={(tab) => setCurrentTab(tab)}
      />
    </div>
  );
}
