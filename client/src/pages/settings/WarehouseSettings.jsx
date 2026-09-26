import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Warehouse, Plus } from 'lucide-react';

export default function WarehouseSettings() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      if (res.data.success) {
        setWarehouses(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/warehouses', { name, code, address });
      if (res.data.success) {
        setName('');
        setCode('');
        setAddress('');
        fetchWarehouses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create warehouse');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Warehouse & Locations Settings</h2>
        <p className="text-xs text-gray-500">Configure multi-warehouse structures and internal stock locations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Warehouse Creation Form */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" /> Add Warehouse
          </h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Warehouse Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Central Hub"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Warehouse Code</label>
              <input
                type="text"
                required
                placeholder="e.g. WH-01"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Address / Location Info</label>
              <input
                type="text"
                placeholder="e.g. Industrial Area Phase 2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Create Warehouse
            </button>
          </form>
        </div>

        {/* Existing Warehouses List */}
        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading warehouses...</p>
          ) : warehouses.length === 0 ? (
            <p className="text-sm text-gray-500">No warehouses configured yet.</p>
          ) : (
            warehouses.map((wh) => (
              <div key={wh._id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <Warehouse size={18} className="text-indigo-600" />
                      {wh.name} <span className="text-xs font-mono text-gray-400">({wh.code})</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{wh.address || 'No address specified'}</p>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase text-gray-400">Configured Locations:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {wh.locations && wh.locations.length > 0 ? (
                      wh.locations.map((loc) => (
                        <span
                          key={loc._id}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {loc.name} ({loc.code})
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">Default locations active</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
