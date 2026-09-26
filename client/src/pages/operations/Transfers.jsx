import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { ArrowLeftRight, CheckCircle } from 'lucide-react';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransfers();
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

  const handleValidate = async (id) => {
    try {
      const res = await api.post(`/operations/${id}/validate`);
      if (res.data.success) {
        alert('Internal transfer completed!');
        fetchTransfers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Transfer failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Internal Transfers</h2>
        <p className="text-xs text-gray-500">Move inventory between warehouses, production floors, and storage racks</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Reference</th>
              <th className="px-6 py-3 text-left font-semibold">Source Location</th>
              <th className="px-6 py-3 text-left font-semibold">Destination Location</th>
              <th className="px-6 py-3 text-center font-semibold">Status</th>
              <th className="px-6 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-6 text-gray-500">Loading transfers...</td></tr>
            ) : transfers.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-6 text-gray-500">No internal transfers found.</td></tr>
            ) : (
              transfers.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono font-medium text-indigo-600">{t.reference}</td>
                  <td className="px-6 py-4 text-gray-700">{t.sourceLocation?.name}</td>
                  <td className="px-6 py-4 text-gray-700">{t.destLocation?.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      t.status === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {t.status !== 'DONE' && t.status !== 'CANCELED' && (
                      <button
                        onClick={() => handleValidate(t._id)}
                        className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
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
    </div>
  );
}
