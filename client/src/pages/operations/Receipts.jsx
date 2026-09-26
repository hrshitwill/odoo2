import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, CheckCircle, ArrowDownLeft, X, Trash2 } from 'lucide-react';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [partner, setPartner] = useState('');
  const [destLocation, setDestLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product: '', demandQty: 1 }]);

  // Options
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchReceipts();
    fetchOptions();
  }, []);

  const fetchReceipts = async () => {
    try {
      const res = await api.get('/operations?type=RECEIPT');
      if (res.data.success) {
        setReceipts(res.data.data);
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
        if (locRes.data.data.length > 0) {
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

  const handleCreateReceipt = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/operations', {
        type: 'RECEIPT',
        partner: partner || 'Standard Vendor',
        destLocation,
        items,
        notes,
      });

      if (res.data.success) {
        setShowModal(false);
        setPartner('');
        setNotes('');
        fetchReceipts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create receipt');
    }
  };

  const handleValidate = async (id) => {
    try {
      const res = await api.post(`/operations/${id}/validate`);
      if (res.data.success) {
        alert('Receipt validated! Stock has been added to warehouse inventory.');
        fetchReceipts();
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
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <ArrowDownLeft size={18} />
            </span>
            Receipts (Incoming Stock)
          </h2>
          <p className="text-xs text-gray-500 mt-1">Receive stock from vendors and automatically increment warehouse levels</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus size={16} />
          <span>New Receipt</span>
        </button>
      </div>

      {/* Receipts Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3.5 text-left font-semibold">Reference</th>
              <th className="px-6 py-3.5 text-left font-semibold">Supplier / Vendor</th>
              <th className="px-6 py-3.5 text-left font-semibold">Destination Rack</th>
              <th className="px-6 py-3.5 text-left font-semibold">Line Items</th>
              <th className="px-6 py-3.5 text-center font-semibold">Status</th>
              <th className="px-6 py-3.5 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">Loading receipts...</td></tr>
            ) : receipts.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">No receipts found. Click "New Receipt" to receive goods.</td></tr>
            ) : (
              receipts.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">{r.reference}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{r.partner || 'Standard Supplier'}</td>
                  <td className="px-6 py-4 text-gray-600">{r.destLocation?.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {r.items?.map((i, idx) => (
                      <span key={idx} className="inline-block bg-slate-100 rounded px-2 py-0.5 mr-1 mb-1 font-mono text-[11px]">
                        {i.product?.name}: {i.doneQty || i.demandQty} {i.product?.uom}
                      </span>
                    ))}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.status === 'DONE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.status !== 'DONE' && r.status !== 'CANCELED' && (
                      <button
                        onClick={() => handleValidate(r._id)}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        <CheckCircle size={14} /> Validate & Stock In
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Receipt Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Create Incoming Receipt</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Vendor / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Metals Ltd"
                  value={partner}
                  onChange={(e) => setPartner(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Destination Warehouse Location *</label>
                <select
                  required
                  value={destLocation}
                  onChange={(e) => setDestLocation(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
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
                  <label className="text-xs font-bold uppercase text-gray-500">Products to Receive</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-emerald-600 font-semibold hover:underline"
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
                <label className="block text-xs font-semibold text-gray-700">Notes / PO Reference</label>
                <input
                  type="text"
                  placeholder="e.g. PO-89421"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Create Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
