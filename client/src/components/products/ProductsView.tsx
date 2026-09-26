'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  ListFilter,
  Plus,
  Printer,
  Scan,
  Barcode,
  ArrowRight,
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Product } from '@/types/inventory';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { ProductDetailModal } from './ProductDetailModal';
import { PrintLabelModal } from '@/components/common/PrintLabelModal';
import { NavigationTab } from '@/components/layout/AppSidebar';
import { formatNumber, formatCurrency } from '@/lib/utils';

interface ProductsViewProps {
  onNavigate: (tab: NavigationTab) => void;
  selectedWarehouseId: string;
  onOpenScanner?: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  onNavigate,
  selectedWarehouseId,
  onOpenScanner,
}) => {
  const {
    products,
    categories,
    warehouses,
    getTotalStockForProduct,
    getAvailableStockForProduct,
    addProduct,
  } = useInventory();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Detail Modal State
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Print Label State
  const [printProduct, setPrintProduct] = useState<Product | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // New Product Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState(categories[0]?.name || 'Raw Materials');
  const [newProdUom, setNewProdUom] = useState('units');
  const [newProdCost, setNewProdCost] = useState('10.00');
  const [newProdPrice, setNewProdPrice] = useState('20.00');
  const [newProdReorder, setNewProdReorder] = useState('25');
  const [newProdMax, setNewProdMax] = useState('150');
  const [newProdInitialStock, setNewProdInitialStock] = useState('100');
  const [newProdWarehouse, setNewProdWarehouse] = useState(warehouses[0]?.id || 'wh-main');
  const [newProdSupplier, setNewProdSupplier] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesSearch =
        !searchQuery ||
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.barcode && prod.barcode.includes(searchQuery));

      const matchesCategory =
        selectedCategory === 'all' || prod.category === selectedCategory;

      const totalStock = getTotalStockForProduct(prod);
      let statusMatches = true;
      if (selectedStatus === 'in_stock') {
        statusMatches = totalStock > prod.reorderPoint;
      } else if (selectedStatus === 'low_stock') {
        statusMatches = totalStock <= prod.reorderPoint && totalStock > 0;
      } else if (selectedStatus === 'out_of_stock') {
        statusMatches = totalStock === 0;
      }

      let matchesWarehouse = true;
      if (selectedWarehouseId !== 'all') {
        matchesWarehouse = (prod.locationStock || []).some(
          (ls) => ls.warehouseId === selectedWarehouseId && ls.quantity > 0
        );
      }

      return matchesSearch && matchesCategory && statusMatches && matchesWarehouse;
    });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedStatus,
    selectedWarehouseId,
    getTotalStockForProduct,
  ]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdSku) return;

    const created = addProduct({
      name: newProdName,
      sku: newProdSku,
      category: newProdCategory,
      unitOfMeasure: newProdUom,
      costPrice: parseFloat(newProdCost) || 0,
      sellingPrice: parseFloat(newProdPrice) || 0,
      reorderPoint: parseInt(newProdReorder, 10) || 0,
      maxStock: parseInt(newProdMax, 10) || 100,
      initialStock: parseInt(newProdInitialStock, 10) || 0,
      initialWarehouseId: newProdWarehouse,
      supplierName: newProdSupplier || 'Standard Sourcing',
    });

    setIsNewModalOpen(false);
    setNewProdName('');
    setNewProdSku('');
    setActiveProduct(created);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6 pb-16 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-metadata uppercase tracking-wider text-slate-400 font-medium">
            Master Data
          </div>
          <h1 className="text-page-title">
            Products
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filteredProducts.length} of {products.length} products indexed
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              <Scan className="w-4 h-4 text-orange-600" strokeWidth={1.75} />
              <span>Scan Barcode</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="btn-primary py-1.5 px-3 text-xs"
          >
            <Plus className="w-4 h-4 text-orange-400" strokeWidth={2} />
            <span>Create Product</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Smart Filters */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU, or barcode..."
              className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all font-mono"
            />
          </div>

          <div className="w-full md:w-52">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Table (Clean, Restrained, High Legibility) */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse font-body">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-medium">
              <tr>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4 font-mono">SKU</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4 text-right">Available</th>
                <th className="py-2.5 px-4 text-right">Reserved</th>
                <th className="py-2.5 px-4 text-right">Reorder Point</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-body">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No products matching search query.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const total = getTotalStockForProduct(prod);
                  const available = getAvailableStockForProduct(prod);
                  const reserved = total - available;

                  const isLow = total <= prod.reorderPoint && total > 0;
                  const isOut = total === 0;
                  const primaryLoc = prod.locationStock?.[0];

                  return (
                    <tr
                      key={prod.id}
                      onClick={() => {
                        setActiveProduct(prod);
                        setIsDetailOpen(true);
                      }}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Product Name */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 group-hover:text-orange-600 transition-colors">
                          {prod.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-sm mt-0.5">
                          {prod.description || 'No description'}
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono text-xs">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {prod.sku}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {prod.category}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-xs">
                        {primaryLoc ? (
                          <div>
                            <span className="text-slate-800">{primaryLoc.warehouseName}</span>
                            <div className="text-[11px] text-slate-400">{primaryLoc.locationName}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Available */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatNumber(available)}{' '}
                        <span className="text-[11px] font-normal text-slate-400">{prod.unitOfMeasure}</span>
                      </td>

                      {/* Reserved */}
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {reserved > 0 ? (
                          <span className="text-amber-700 font-medium">
                            {formatNumber(reserved)} {prod.unitOfMeasure}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>

                      {/* Reorder Point */}
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {prod.reorderPoint} {prod.unitOfMeasure}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}
                          size="sm"
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Print Label"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrintProduct(prod);
                              setIsPrintOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveProduct(prod);
                              setIsDetailOpen(true);
                            }}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                          >
                            View →
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <ProductDetailModal
        product={activeProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Label Printer Modal */}
      <PrintLabelModal
        product={printProduct}
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
      />

      {/* Create Product Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create Product"
        subtitle="Master Data Entry"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 font-body">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="col-span-2">
              <label className="block text-xs uppercase text-slate-600 font-medium mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                placeholder="e.g. Steel Rods (Grade 40 Industrial)"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-600 font-medium mb-1 font-mono">
                SKU / Code *
              </label>
              <input
                type="text"
                required
                value={newProdSku}
                onChange={(e) => setNewProdSku(e.target.value.toUpperCase())}
                placeholder="e.g. STL-001"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-600 font-medium mb-1">
                Category
              </label>
              <select
                value={newProdCategory}
                onChange={(e) => setNewProdCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-600 font-medium mb-1">
                Unit of Measure
              </label>
              <select
                value={newProdUom}
                onChange={(e) => setNewProdUom(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="units">units</option>
                <option value="kg">kg</option>
                <option value="meters">meters</option>
                <option value="boxes">boxes</option>
                <option value="liters">liters</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-600 font-medium mb-1">
                Supplier
              </label>
              <input
                type="text"
                value={newProdSupplier}
                onChange={(e) => setNewProdSupplier(e.target.value)}
                placeholder="e.g. MetalWorks Ltd."
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-600 font-medium mb-1 font-mono">
                Reorder Point (Min)
              </label>
              <input
                type="number"
                value={newProdReorder}
                onChange={(e) => setNewProdReorder(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-600 font-medium mb-1 font-mono">
                Maximum Stock
              </label>
              <input
                type="number"
                value={newProdMax}
                onChange={(e) => setNewProdMax(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-200">
              <div className="text-xs uppercase text-slate-500 font-medium mb-2">
                Initial Stock Allocation (Optional)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1 font-mono">
                    Initial Quantity
                  </label>
                  <input
                    type="number"
                    value={newProdInitialStock}
                    onChange={(e) => setNewProdInitialStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Warehouse
                  </label>
                  <select
                    value={newProdWarehouse}
                    onChange={(e) => setNewProdWarehouse(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary py-1.5 px-3 text-xs"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
