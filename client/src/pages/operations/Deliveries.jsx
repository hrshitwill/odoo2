import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { CheckCircle } from 'lucide-react';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
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
      <div>
        <h2 className="text-xl font-bold text-gray-900">Delivery Orders (Outgoing Goods)</h2>
        <p className="text-xs text-gray-500">Pick, pack, and validate outgoing customer shipments</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Reference</th>
              <th className="px-6 py-3 text-left font-semibold">Customer</th>
              <th className="px-6 py-3 text-left font-semibold">Source Location</th>
              <th className="px-6 py-3 text-center font-semibold">Status</th>
              <th className="px-6 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-6 text-gray-500">Loading deliveries...</td></tr>
            ) : deliveries.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-6 text-gray-500">No delivery orders found.</td></tr>
            ) : (
              deliveries.map((d) => (
                <tr key={d._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono font-medium text-indigo-600">{d.reference}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{d.partner || 'Retail Customer'}</td>
                  <td className="px-6 py-4 text-gray-600">{d.sourceLocation?.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      d.status === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {d.status !== 'DONE' && d.status !== 'CANCELED' && (
                      <button
                        onClick={() => handleValidate(d._id)}
                        className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        <CheckCircle size={14} /> Validate & Deliver
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
