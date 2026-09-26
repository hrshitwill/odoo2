import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { History, Search, Filter, Download } from 'lucide-react';

export default function MoveHistory() {
  const [moves, setMoves] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, [page, search]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
      });
      if (search) params.append('reference', search);

      const res = await api.get(`/ledger?${params.toString()}`);
      if (res.data.success) {
        setMoves(res.data.data);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="p-1.5 bg-slate-100 text-slate-800 rounded-lg">
              <History size={18} />
            </span>
            Move History (Stock Ledger)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Complete, immutable double-entry audit trail tracking every physical stock change across all locations
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Reference..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3.5 text-left font-semibold">Date & Timestamp</th>
              <th className="px-6 py-3.5 text-left font-semibold">Reference</th>
              <th className="px-6 py-3.5 text-left font-semibold">Product</th>
              <th className="px-6 py-3.5 text-left font-semibold">From Location</th>
              <th className="px-6 py-3.5 text-left font-semibold">To Location</th>
              <th className="px-6 py-3.5 text-right font-semibold">Quantity</th>
              <th className="px-6 py-3.5 text-left font-semibold">Operator</th>
              <th className="px-6 py-3.5 text-left font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="8" className="text-center py-10 text-gray-500">Loading ledger moves...</td></tr>
            ) : moves.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-10 text-gray-500">No stock movements recorded.</td></tr>
            ) : (
              moves.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">{m.reference}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {m.product?.name} <span className="font-mono text-gray-400 text-[11px]">({m.product?.sku})</span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{m.fromLocation?.name}</td>
                  <td className="px-6 py-4 text-gray-700">{m.toLocation?.name}</td>
                  <td className="px-6 py-4 text-right font-extrabold text-sm text-gray-900">
                    {m.quantity} {m.product?.uom}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{m.performedBy?.name || 'System Auto'}</td>
                  <td className="px-6 py-4 text-gray-500 text-[11px] italic max-w-xs truncate">{m.notes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>Showing Page <strong>{page}</strong> of <strong>{pages}</strong> ({total} total movements)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 border border-gray-300 rounded-lg bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="px-3 py-1 border border-gray-300 rounded-lg bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
