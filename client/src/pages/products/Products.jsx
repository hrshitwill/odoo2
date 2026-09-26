import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Search, Filter, AlertCircle, Warehouse, Eye, Edit3, X } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [locations, setLocations] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Raw Materials',
    uom: 'Units',
    minStockRule: 10,
    maxStockRule: 100,
    costPrice: 0,
    initialStock: 0,
    locationId: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchLocations();
  }, [search, categoryFilter, lowStockOnly]);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/warehouses/locations?type=INTERNAL');
      if (res.data.success) {
        setLocations(res.data.data);
        if (res.data.data.length > 0) {
          setFormData((prev) => ({ ...prev, locationId: res.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (lowStockOnly) params.append('lowStock', 'true');

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/products', formData);
      if (res.data.success) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          sku: '',
          category: 'Raw Materials',
          uom: 'Units',
          minStockRule: 10,
          maxStockRule: 100,
          costPrice: 0,
          initialStock: 0,
          locationId: locations[0]?._id || '',
        });
        fetchProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating product');
    }
  };

  const handleViewLocationStock = async (product) => {
    try {
      const res = await api.get(`/products/${product._id}`);
      if (res.data.success) {
        setSelectedProduct(res.data.data);
        setShowLocationModal(true);
      }
    } catch (err) {
      alert('Failed to load location stock breakdown');
    }
  };

  const categories = ['ALL', 'Raw Materials', 'Finished Goods', 'Hardware', 'Components', 'General'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Products Catalog</h2>
          <p className="text-xs text-gray-500">Manage item master, stock availability per location, and reorder thresholds</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus size={16} />
          <span>New Product</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Low Stock Toggle */}
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span>Show Low Stock Only</span>
          </label>
        </div>

        <span className="text-xs text-gray-500">
          Showing <strong>{products.length}</strong> items
        </span>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3.5 text-left font-semibold">SKU / Code</th>
              <th className="px-6 py-3.5 text-left font-semibold">Product Name</th>
              <th className="px-6 py-3.5 text-left font-semibold">Category</th>
              <th className="px-6 py-3.5 text-left font-semibold">UOM</th>
              <th className="px-6 py-3.5 text-right font-semibold">On-Hand Stock</th>
              <th className="px-6 py-3.5 text-center font-semibold">Reorder Min/Max</th>
              <th className="px-6 py-3.5 text-center font-semibold">Status</th>
              <th className="px-6 py-3.5 text-center font-semibold">Locations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-gray-500">Loading products...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-gray-500">
                  No products found. Click "New Product" above to create one.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">{p.sku}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{p.uom}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-extrabold text-sm text-gray-900">{p.totalStock}</span>{' '}
                    <span className="text-[11px] text-gray-500">{p.uom}</span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-gray-500">
                    Min: {p.minStockRule} / Max: {p.maxStockRule}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {p.isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    ) : p.isLowStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        <AlertCircle size={10} /> Low Stock
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Adequate
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleViewLocationStock(p)}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      <Eye size={14} /> View Racks
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Create New Product</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Copper Wire Spool 50m"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">SKU / Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CPR-WIR-01"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Raw Materials"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Unit of Measure (UOM)</label>
                  <input
                    type="text"
                    placeholder="kg, Units, pcs, meters"
                    value={formData.uom}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Min Reorder Rule</label>
                  <input
                    type="number"
                    value={formData.minStockRule}
                    onChange={(e) => setFormData({ ...formData, minStockRule: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Max Stock Rule</label>
                  <input
                    type="number"
                    value={formData.maxStockRule}
                    onChange={(e) => setFormData({ ...formData, maxStockRule: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Initial Opening Stock */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-gray-800">Initial Opening Stock (Optional)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-600">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.initialStock}
                      onChange={(e) => setFormData({ ...formData, initialStock: Number(e.target.value) })}
                      className="w-full mt-1 px-2.5 py-1.5 bg-white border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600">Initial Location</label>
                    <select
                      value={formData.locationId}
                      onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                      className="w-full mt-1 px-2.5 py-1.5 bg-white border rounded-lg text-xs"
                    >
                      {locations.map((loc) => (
                        <option key={loc._id} value={loc._id}>
                          {loc.name} ({loc.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Per Location Breakdown Modal */}
      {showLocationModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-xs font-mono text-indigo-600">{selectedProduct.sku}</p>
              </div>
              <button onClick={() => setShowLocationModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <span className="text-xs font-semibold text-indigo-900">Total Physical Stock:</span>
                <span className="text-xs font-extrabold text-indigo-900">
                  {selectedProduct.totalStock} {selectedProduct.uom}
                </span>
              </div>

              <span className="text-xs font-bold uppercase text-gray-400">Stock Availability by Location:</span>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedProduct.stockPerLocation && selectedProduct.stockPerLocation.length > 0 ? (
                  selectedProduct.stockPerLocation.map((q) => (
                    <div key={q._id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <div>
                        <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                          <Warehouse size={14} className="text-indigo-600" />
                          {q.location?.name}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">{q.location?.code}</span>
                      </div>
                      <span className="font-bold text-xs text-gray-900">
                        {q.quantity} {selectedProduct.uom}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 py-4 text-center">No location stock recorded.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
