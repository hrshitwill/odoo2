import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { SlidersHorizontal, Check } from 'lucide-react';

export default function Adjustments() {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [countedQty, setCountedQty] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [prodRes, locRes] = await Promise.all([
        api.get('/products'),
        api.get('/warehouses/locations?type=INTERNAL'),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (locRes.data.success) setLocations(locRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post('/adjustments', {
        productId: selectedProduct,
        locationId: selectedLocation,
        countedQty: Number(countedQty),
        reason,
      });
      if (res.data.success) {
        setMessage(res.data.message);
        setCountedQty('');
        setReason('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Adjustment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Inventory Adjustments</h2>
        <p className="text-xs text-gray-500">
          Reconcile physical stock counts with recorded inventory (e.g. damaged goods, shrinkage, or audit corrections).
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <Check size={18} />
          {message}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleAdjust} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Product</label>
            <select
              required
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku}) - UOM: {p.uom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Location</label>
            <select
              required
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Internal Location / Rack --</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Physical Counted Quantity</label>
            <input
              type="number"
              required
              min="0"
              placeholder="e.g. 97"
              value={countedQty}
              onChange={(e) => setCountedQty(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Reason / Notes</label>
            <input
              type="text"
              placeholder="e.g. 3 kg damaged during handling"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <SlidersHorizontal size={16} />
            <span>Apply Count & Update Stock Ledger</span>
          </button>
        </form>
      </div>
    </div>
  );
}
