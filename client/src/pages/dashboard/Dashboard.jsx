import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Filter,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState({
    totalProducts: 0,
    totalItemsInStock: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    scheduledTransfers: 0,
  });

  const [operations, setOperations] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);

  // Dynamic Filters
  const [filterDocType, setFilterDocType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterWarehouse, setFilterWarehouse] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [filterDocType, filterStatus, filterWarehouse, filterCategory]);

  const loadDashboardData = async () => {
    setRefreshing(true);
    try {
      // 1. Fetch KPIs
      const kpiParams = new URLSearchParams();
      if (filterCategory !== 'ALL') kpiParams.append('category', filterCategory);
      if (filterWarehouse !== 'ALL') kpiParams.append('warehouseId', filterWarehouse);

      const kpiRes = await api.get(`/dashboard/kpis?${kpiParams.toString()}`);
      if (kpiRes.data.success) {
        setKpis(kpiRes.data.data);
      }

      // 2. Fetch Operations matching filters
      const opParams = new URLSearchParams();
      if (filterDocType !== 'ALL') opParams.append('type', filterDocType);
      if (filterStatus !== 'ALL') opParams.append('status', filterStatus);

      const opRes = await api.get(`/operations?${opParams.toString()}`);
      if (opRes.data.success) {
        setOperations(opRes.data.data.slice(0, 10)); // Top 10 recent
      }

      // 3. Fetch low stock alert products
      const lowStockRes = await api.get('/products?lowStock=true');
      if (lowStockRes.data.success) {
        setLowStockProducts(lowStockRes.data.data.slice(0, 5));
        const allCategories = [...new Set(lowStockRes.data.data.map((p) => p.category))];
        setCategories(allCategories);
      }

      // 4. Fetch Warehouses for filter
      const whRes = await api.get('/warehouses');
      if (whRes.data.success) {
        setWarehouses(whRes.data.data);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleValidateOperation = async (id, type) => {
    try {
      const res = await api.post(`/operations/${id}/validate`);
      if (res.data.success) {
        alert(`${type} validated and stock updated in ledger!`);
        loadDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Operation validation failed');
    }
  };

  const kpiCards = [
    {
      title: 'Total Products in Stock',
      value: kpis.totalProducts,
      subValue: `${kpis.totalItemsInStock} total units`,
      icon: Package,
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-600 text-white',
    },
    {
      title: 'Low / Out of Stock',
      value: kpis.lowStockItems,
      subValue: `${kpis.outOfStockItems} out of stock`,
      icon: AlertTriangle,
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-600 text-white',
      badge: kpis.lowStockItems > 0 ? 'Action Needed' : 'Normal',
    },
    {
      title: 'Pending Receipts',
      value: kpis.pendingReceipts,
      subValue: 'Incoming vendor shipments',
      icon: ArrowDownLeft,
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
      onClick: () => navigate('/operations/receipts'),
    },
    {
      title: 'Pending Deliveries',
      value: kpis.pendingDeliveries,
      subValue: 'Outgoing client orders',
      icon: ArrowUpRight,
      bg: 'bg-purple-50 text-purple-800 border-purple-200',
      iconBg: 'bg-purple-600 text-white',
      onClick: () => navigate('/operations/deliveries'),
    },
    {
      title: 'Transfers Scheduled',
      value: kpis.scheduledTransfers,
      subValue: 'Internal floor moves',
      icon: ArrowLeftRight,
      bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      iconBg: 'bg-indigo-600 text-white',
      onClick: () => navigate('/operations/transfers'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory Operations Dashboard</h2>
          <p className="text-xs text-gray-500 mt-1">Real-time centralized tracking of stock levels, shipments, and ledger movements.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/operations/receipts')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <ArrowDownLeft size={14} /> New Receipt
          </button>
          <button
            onClick={() => navigate('/operations/deliveries')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <ArrowUpRight size={14} /> New Delivery
          </button>
          <button
            onClick={() => navigate('/operations/transfers')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <ArrowLeftRight size={14} /> Internal Transfer
          </button>
          <button
            onClick={() => navigate('/operations/adjustments')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Count Adjustment
          </button>
        </div>
      </div>

      {/* Dynamic Filters Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <Filter size={14} /> Dynamic Filters:
          </span>

          {/* Document Type */}
          <select
            value={filterDocType}
            onChange={(e) => setFilterDocType(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Documents</option>
            <option value="RECEIPT">Receipts (Incoming)</option>
            <option value="DELIVERY">Delivery Orders (Outgoing)</option>
            <option value="INTERNAL">Internal Transfers</option>
            <option value="ADJUSTMENT">Adjustments</option>
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="WAITING">Waiting</option>
            <option value="READY">Ready</option>
            <option value="DONE">Done</option>
            <option value="CANCELED">Canceled</option>
          </select>

          {/* Warehouse */}
          <select
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>

          {/* Product Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:text-indigo-800 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Syncing...' : 'Refresh KPIs'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              onClick={c.onClick}
              className={`p-5 rounded-2xl border ${c.bg} shadow-sm flex flex-col justify-between transition-transform duration-150 ${
                c.onClick ? 'cursor-pointer hover:shadow hover:-translate-y-0.5' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-tight">{c.title}</span>
                <div className={`p-2 rounded-xl ${c.iconBg}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black">{loading ? '...' : c.value}</div>
                <div className="text-xs opacity-75 mt-0.5">{c.subValue}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Operations & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Operations (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900">Recent Operations Snapshot</h3>
              <p className="text-xs text-gray-500">Live operational documents matching selected filter criteria</p>
            </div>
            <button
              onClick={() => navigate('/operations/move-history')}
              className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
            >
              Move History <ExternalLink size={12} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Reference</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Type</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Partner / Flow</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {operations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400">
                      No operations found for current filters.
                    </td>
                  </tr>
                ) : (
                  operations.map((op) => (
                    <tr key={op._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-medium text-indigo-600">{op.reference}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                          {op.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {op.partner || `${op.sourceLocation?.name} ➔ ${op.destLocation?.name}`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            op.status === 'DONE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : op.status === 'READY'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {op.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {op.status === 'READY' || op.status === 'DRAFT' ? (
                          <button
                            onClick={() => handleValidateOperation(op._id, op.type)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors"
                          >
                            Validate
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[11px]">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts Card (1 col) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" /> Low Stock Items
            </h3>
            <button
              onClick={() => navigate('/products')}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              View Catalog
            </button>
          </div>

          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center">
                ✅ All products are adequately stocked according to reorder rules.
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p._id} className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-900 text-xs">{p.name}</span>
                    <span className="text-[11px] font-mono text-indigo-600">{p.sku}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-600">
                    <span>On hand: <strong className="text-amber-900 font-bold">{p.totalStock} {p.uom}</strong></span>
                    <span>Reorder Min: {p.minStockRule}</span>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => navigate('/operations/receipts')}
                      className="text-[11px] text-indigo-600 font-semibold hover:underline"
                    >
                      + Create Receipt for restock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
