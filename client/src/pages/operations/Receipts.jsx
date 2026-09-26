import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, CheckCircle, XCircle } from 'lucide-react';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
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

  const handleValidate = async (id) => {
    try {
      const res = await api.post(`/operations/${id}/validate`);
      if (res.data.success) {
        alert('Receipt validated! Stock has been updated in ledger.');
        fetchReceipts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Validation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Receipts (Incoming Goods)</h2>
          <p className="text-xs text-gray-500">Receive goods from suppliers and automatically increment stock</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Reference</th>
              <th className="px-6 py-3 text-left font-semibold">Vendor / Supplier</th>
              <th className="px-6 py-3 text-left font-semibold">Destination Location</th>
              <th className="px-6 py-3 text-center font-semibold">Status</th>
              <th className="px-6 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-6 text-gray-500">Loading receipts...</td></tr>
            ) : receipts.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-6 text-gray-500">No receipts found.</td></tr>
            ) : (
              receipts.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono font-medium text-indigo-600">{r.reference}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{r.partner || 'Direct Purchase'}</td>
                  <td className="px-6 py-4 text-gray-600">{r.destLocation?.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      r.status === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.status !== 'DONE' && r.status !== 'CANCELED' && (
                      <button
                        onClick={() => handleValidate(r._id)}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
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
    </div>
  );
}
