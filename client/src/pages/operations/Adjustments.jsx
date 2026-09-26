import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { SlidersHorizontal, CheckCircle, AlertTriangle, ArrowRight, History } from 'lucide-react';

export default function Adjustments() {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [recentAdjustments, setRecentAdjustments] = useState([]);

  // Form
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [recordedQty, setRecordedQty] = useState(0);
  const [countedQty, setCountedQty] = useState('');
  const [reason, setReason] = useState('');
  const [loadingRecorded, setLoadingRecorded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchOptions();
    fetchRecentAdjustments();
  }, []);

  const fetchOptions = async () => {
    try {
      const [prodRes, locRes] = await Promise.all([
        api.get('/products'),
        api.get('/warehouses/locations?type=INTERNAL'),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (locRes.data.success) {
        setLocations(locRes.data.data);
        if (locRes.data.data.length > 0) setSelectedLocation(locRes.data.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecentAdjustments = async () => {
    try {
      const res = await api.get('/ledger?limit=10');
      if (res.data.success) {
        const adjustmentsOnly = res.data.data.filter((m) => m.reference?.startsWith('ADJ-'));
        setRecentAdjustments(adjustmentsOnly);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch current on-hand recorded quantity whenever product or location changes
  useEffect(() => {
    if (selectedProduct && selectedLocation) {
      fetchCurrentRecordedStock(selectedProduct, selectedLocation);
    }
  }, [selectedProduct, selectedLocation]);

  const fetchCurrentRecordedStock = async (prodId, locId) => {
    setLoadingRecorded(true);
    try {
      const res = await api.get(`/products/${prodId}`);
      if (res.data.success) {
        const quant = res.data.data.stockPerLocation?.find(
          (q) => q.location?._id?.toString() === locId.toString()
        );
        setRecordedQty(quant ? quant.quantity : 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecorded(false);
    }
  };

  const delta = countedQty !== '' ? Number(countedQty) - recordedQty : null;

  const handleAdjust = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');
    try {
      const res = await api.post('/adjustments', {
        productId: selectedProduct,
        locationId: selectedLocation,
        countedQty: Number(countedQty),
        reason,
      });

      if (res.data.success) {
        setSuccessMessage(res.data.message);
        setRecordedQty(Number(countedQty));
        setCountedQty('');
        setReason('');
        fetchRecentAdjustments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Adjustment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="p-1.5 bg-slate-100 text-slate-800 rounded-lg">
            <SlidersHorizontal size={18} />
          </span>
          Inventory Adjustments
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Fix mismatches between recorded ledger quantities and physical floor counts (e.g. damaged items, shrinkage, audit counts)
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle size={18} className="text-emerald-600" />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adjustment Input Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Physical Count Reconciliation</h3>

          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Product *</label>
                <select
                  required
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500"
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
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Storage Location / Rack *</label>
                <select
                  required
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reconciliation Comparison Card */}
            {selectedProduct && selectedLocation && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-3 text-center items-center">
                <div>
                  <span className="text-[11px] text-gray-500 block uppercase font-bold">Recorded Stock</span>
                  <span className="text-lg font-black text-gray-800">
                    {loadingRecorded ? '...' : recordedQty}
                  </span>
                </div>
                <div>
                  <ArrowRight size={18} className="mx-auto text-gray-400" />
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block uppercase font-bold">Physical Count</span>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Enter count"
                    value={countedQty}
                    onChange={(e) => setCountedQty(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 border rounded-lg text-center font-bold text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Live Delta Indicator */}
            {delta !== null && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                delta < 0
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : delta > 0
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                <span>Calculated Adjustment Delta:</span>
                <span className="text-sm font-black font-mono">
                  {delta > 0 ? `+${delta}` : delta} (
                  {delta < 0 ? 'Stock Loss / Damage' : delta > 0 ? 'Surplus Found' : 'Balanced'}
                  )
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Reason / Notes</label>
              <input
                type="text"
                placeholder="e.g. 3 kg damaged during handling or regular periodic count audit"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedProduct}
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Applying Adjustment...' : 'Apply Physical Count & Update Ledger'}
            </button>
          </form>
        </div>

        {/* Recent Adjustments Log (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <History size={16} className="text-indigo-600" /> Recent Adjustments
          </h3>

          <div className="space-y-3">
            {recentAdjustments.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No adjustment records logged yet.</p>
            ) : (
              recentAdjustments.map((a) => (
                <div key={a._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-900 text-xs">{a.product?.name}</span>
                    <span className="text-[10px] font-mono text-indigo-600 font-bold">{a.reference}</span>
                  </div>
                  <div className="text-[11px] text-gray-600 flex justify-between">
                    <span>Adjusted Qty: <strong>{a.quantity} {a.product?.uom}</strong></span>
                    <span className="text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 italic truncate">{a.notes}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
