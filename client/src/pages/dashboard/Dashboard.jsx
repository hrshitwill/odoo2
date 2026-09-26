import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Package, AlertTriangle, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';

export default function Dashboard() {
  const [kpis, setKpis] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    scheduledTransfers: 0,
  });

  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardKpis();
  }, []);

  const fetchDashboardKpis = async () => {
    try {
      const res = await api.get('/dashboard/kpis');
      if (res.data.success) {
        setKpis(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: 'Total Products', value: kpis.totalProducts, icon: Package, color: 'text-blue-600 bg-blue-50' },
    { title: 'Low / Out of Stock', value: `${kpis.lowStockItems} (${kpis.outOfStockItems} out)`, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
    { title: 'Pending Receipts', value: kpis.pendingReceipts, icon: ArrowDownLeft, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Pending Deliveries', value: kpis.pendingDeliveries, icon: ArrowUpRight, color: 'text-purple-600 bg-purple-50' },
    { title: 'Internal Transfers', value: kpis.scheduledTransfers, icon: ArrowLeftRight, color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Dynamic Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Filter View:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Documents</option>
            <option value="RECEIPT">Receipts</option>
            <option value="DELIVERY">Delivery Orders</option>
            <option value="INTERNAL">Internal Transfers</option>
            <option value="ADJUSTMENT">Adjustments</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="WAITING">Waiting</option>
            <option value="READY">Ready</option>
            <option value="DONE">Done</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </div>
        <button
          onClick={fetchDashboardKpis}
          className="text-xs text-indigo-600 font-medium hover:underline"
        >
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">{c.title}</span>
                <div className={`p-2 rounded-lg ${c.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900">{loading ? '...' : c.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operations Quick Status */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Operations Snapshot</h2>
        <div className="text-sm text-gray-500">
          Showing real-time aggregated metrics across warehouses. Navigate to specific operations on the left sidebar to manage documents.
        </div>
      </div>
    </div>
  );
}
