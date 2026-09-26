import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, ArrowLeftRight, CheckCircle, X, Trash2 } from 'lucide-react';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [sourceLocation, setSourceLocation] = useState('');
  const [destLocation, setDestLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product: '', demandQty: 1 }]);

  // Options
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchTransfers();
    fetchOptions();
  }, []);

  const fetchTransfers = async () => {
    try {
      const res = await api.get('/operations?type=INTERNAL');
      if (res.data.success) {
        setTransfers(res.data.data);
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
          setItems([{ product: prodRes.data.data[0]._id, demandQty: 10 }]);
        }
      }
      if (locRes.data.success) {
        setLocations(locRes.data.data);
        if (locRes.data.data.length >= 2) {
          setSourceLocation(locRes.data.data[0]._id);
          setDestLocation(locRes.data.data[1]._id);
        } else if (locRes.data.data.length === 1) {
          setSourceLocation(locRes.data.data[0]._id);
          setDestLocation(locRes.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = () => {
    if (products.length > 0) {
      setItems([...items, { product: products[0]._id, demandQty: 10 }]);
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

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (sourceLocation === destLocation) {
      return alert('Source and Destination locations must be different for internal transfer.');
    }

    try {
      const res = await api.post('/operations', {
        type: 'INTERNAL',
        partner: 'Internal Workshop / Transfer',
        sourceLocation,
        destLocation,
        items,
        notes,
      });

      if (res.data.success) {
        setShowModal(false);
        setNotes('');
        fetchTransfers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create internal transfer');
    }
  };

  const handleValidate = async (id) => {
    try {
      const res = await api.post(`/operations/${id}/validate`);
      if (res.data.success) {
        alert('Internal transfer validated! Stock moved between locations.');
        fetchTransfers();
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
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <ArrowLeftRight size={18} />
            </span>
            Internal Transfers
          </h2>
          <p className="text-xs text-gray-500 mt-1">Move stock between warehouses, production racks, and staging areas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus size={16} />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Transfers Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3.5 text-left font-semibold">Reference</th>
              <th className="px-6 py-3.5 text-left font-semibold">Source Location</th>
              <th className="px-6 py-3.5 text-left font-semibold">Destination Location</th>
              <th className="px-6 py-3.5 text-left font-semibold">Transfer Items</th>
              <th className="px-6 py-3.5 text-center font-semibold">Status</th>
              <th className="px-6 py-3.5 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">Loading transfers...</td></tr>
            ) : transfers.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">No transfers found. Click "New Transfer" to schedule one.</td></tr>
            ) : (
              transfers.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">{t.reference}</td>
                  <td className="px-6 py-4 text-gray-800 font-medium">{t.sourceLocation?.name}</td>
                  <td className="px-6 py-4 text-gray-800 font-medium">{t.destLocation?.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {t.items?.map((i, idx) => (
                      <span key={idx} className="inline-block bg-slate-100 rounded px-2 py-0.5 mr-1 mb-1 font-mono text-[11px]">
                        {i.product?.name}: {i.doneQty || i.demandQty} {i.product?.uom}
                      </span>
                    ))}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === 'DONE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {t.status !== 'DONE' && t.status !== 'CANCELED' && (
                      <button
                        onClick={() => handleValidate(t._id)}
                        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        <CheckCircle size={14} /> Validate Move
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Schedule Internal Transfer</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">From (Source) *</label>
                  <select
                    required
                    value={sourceLocation}
                    onChange={(e) => setSourceLocation(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc._id} value={loc._id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">To (Destination) *</label>
                  <select
                    required
                    value={destLocation}
                    onChange={(e) => setDestLocation(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc._id} value={loc._id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Line Items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase text-gray-500">Items to Move</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
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
                          {p.name} ({p.sku})
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
                <label className="block text-xs font-semibold text-gray-700">Transfer Reason / Work Order</label>
                <input
                  type="text"
                  placeholder="e.g. WO-4402 Production Feeding"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Schedule Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
