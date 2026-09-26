import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { History } from 'lucide-react';

export default function MoveHistory() {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const res = await api.get('/ledger?limit=100');
      if (res.data.success) {
        setMoves(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Move History (Stock Ledger)</h2>
        <p className="text-xs text-gray-500">Immutable double-entry audit trail for all stock movements</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Date & Time</th>
              <th className="px-6 py-3 text-left font-semibold">Reference</th>
              <th className="px-6 py-3 text-left font-semibold">Product</th>
              <th className="px-6 py-3 text-left font-semibold">From Location</th>
              <th className="px-6 py-3 text-left font-semibold">To Location</th>
              <th className="px-6 py-3 text-right font-semibold">Quantity</th>
              <th className="px-6 py-3 text-left font-semibold">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="7" className="text-center py-6 text-gray-500">Loading stock ledger...</td></tr>
            ) : moves.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-6 text-gray-500">No stock movements logged yet.</td></tr>
            ) : (
              moves.map((m) => (
                <tr key={m._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-indigo-600">{m.reference}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {m.product?.name} <span className="text-xs text-gray-400 font-mono">({m.product?.sku})</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{m.fromLocation?.name}</td>
                  <td className="px-6 py-4 text-gray-600">{m.toLocation?.name}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    {m.quantity} {m.product?.uom}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">{m.performedBy?.name || 'System'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
