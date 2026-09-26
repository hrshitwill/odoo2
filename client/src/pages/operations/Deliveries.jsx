import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, CheckCircle, ArrowUpRight, X, Trash2, AlertCircle } from 'lucide-react';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [partner, setPartner] = useState('');
  const [sourceLocation, setSourceLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product: '', demandQty: 1 }]);

  // Options
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchDeliveries();
    fetchOptions();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const res = await api.get('/operations?type=DELIVERY');
      if (res.data.success) {
        setDeliveries(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [prodRes, locRes] = await Promise.all([
        api.get('/products'),
        api.get('/warehouses/locations?type=INTERNAL'),
      ]);
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
        if (prodRes.data.data.length > 0) {
          setItems([{ product: prodRes.data.data[0]._id, demandQty: 5 }]);
        }
      }
      if (locRes.data.success) {
        setLocations(locRes.data.data);
        if (locRes.data.data.length > 0) {
          setSourceLocation(locRes.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = () => {
    if (products.length > 0) {
      setItems([...items, { product: products[0]._id, demandQty: 5 }]);
    }
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/operations', {
        type: 'DELIVERY',
        partner: partner || 'Retail Customer',
        sourceLocation,
        items,
        notes,
      });

      if (res.data.success) {
        setShowModal(false);
        setPartner('');
        setNotes('');
        fetchDeliveries();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create delivery order');
    }
  };

  const handleValidate = async (id) => {
    try {
      const res = await api.post(`/operations/${id}/validate`);
      if (res.data.success) {
        alert('Delivery validated! Stock decreased and recorded in ledger.');
        fetchDeliveries();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Validation failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
              <ArrowUpRight size={18} />
            </span>
            Delivery Orders (Outgoing Goods)
          </h2>
          <p className="text-xs text-gray-500 mt-1">Pick, pack, and validate customer shipments with stock shortage validation</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus size={16} />
          <span>New Delivery Order</span>
        </button>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3.5 text-left font-semibold">Reference</th>
              <th className="px-6 py-3.5 text-left font-semibold">Customer / Partner</th>
              <th className="px-6 py-3.5 text-left font-semibold">Source Location</th>
              <th className="px-6 py-3.5 text-left font-semibold">Shipped Items</th>
              <th className="px-6 py-3.5 text-center font-semibold">Status</th>
              <th className="px-6 py-3.5 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">Loading deliveries...</td></tr>
            ) : deliveries.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">No delivery orders found. Click "New Delivery Order" to create one.</td></tr>
            ) : (
              deliveries.map((d) => (
                <tr key={d._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">{d.reference}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{d.partner || 'Standard Client'}</td>
                  <td className="px-6 py-4 text-gray-600">{d.sourceLocation?.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {d.items?.map((i, idx) => (
                      <span key={idx} className="inline-block bg-slate-100 rounded px-2 py-0.5 mr-1 mb-1 font-mono text-[11px]">
                        {i.product?.name}: {i.doneQty || i.demandQty} {i.product?.uom}
                      </span>
                    ))}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        d.status === 'DONE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {d.status !== 'DONE' && d.status !== 'CANCELED' && (
                      <button
                        onClick={() => handleValidate(d._id)}
                        className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        <CheckCircle size={14} /> Pick & Deliver
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Delivery Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Create Outgoing Delivery Order</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Customer / Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Construction Corp"
                  value={partner}
                  onChange={(e) => setPartner(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Pick from Source Location *</label>
                <select
                  required
                  value={sourceLocation}
                  onChange={(e) => setSourceLocation(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500"
                >
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Line Items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase text-gray-500">Items to Deliver</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-purple-600 font-semibold hover:underline"
                  >
                    + Add Product Line
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <select
                      value={item.product}
                      onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                    >
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.sku}) - On Hand: {p.totalStock} {p.uom}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      value={item.demandQty}
                      onChange={(e) => handleItemChange(idx, 'demandQty', Number(e.target.value))}
                      className="w-20 px-2.5 py-1.5 border rounded-lg text-xs bg-white text-right"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Sales Order / Dispatch Note</label>
                <input
                  type="text"
                  placeholder="e.g. SO-10492"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Create Delivery Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
