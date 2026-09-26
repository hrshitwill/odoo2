import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Warehouse as WarehouseIcon, Plus, MapPin, Layers, X } from 'lucide-react';

export default function WarehouseSettings() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Warehouse Form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');

  // Location Form Modal
  const [showLocModal, setShowLocModal] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locType, setLocType] = useState('INTERNAL');

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

  const handleCreateWarehouse = async (e) => {
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

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/warehouses/locations', {
        name: locName,
        code: locCode,
        warehouse: selectedWarehouseId,
        type: locType,
      });
      if (res.data.success) {
        setShowLocModal(false);
        setLocName('');
        setLocCode('');
        fetchWarehouses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create location');
    }
  };

  const openAddLocationModal = (whId) => {
    setSelectedWarehouseId(whId);
    setShowLocModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
            <WarehouseIcon size={18} />
          </span>
          Warehouse & Locations Settings
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Configure multi-warehouse physical structures, internal storage racks, and operational movement endpoints
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Warehouse Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Plus size={16} className="text-indigo-600" /> Add New Warehouse
          </h3>
          <form onSubmit={handleCreateWarehouse} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Warehouse Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. North Hub Logistics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Warehouse Short Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. WH-NORTH"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Physical Address / Zone</label>
              <input
                type="text"
                placeholder="e.g. Sector 18, Freight Corridor"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              Create Warehouse
            </button>
          </form>
        </div>

        {/* Existing Warehouses List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <p className="text-xs text-gray-500">Loading warehouses...</p>
          ) : warehouses.length === 0 ? (
            <p className="text-xs text-gray-500">No warehouses configured yet.</p>
          ) : (
            warehouses.map((wh) => (
              <div key={wh._id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <WarehouseIcon size={16} className="text-indigo-600" />
                      {wh.name} <span className="font-mono text-xs text-gray-400 font-bold">({wh.code})</span>
                    </h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-gray-400" /> {wh.address || 'Address unassigned'}
                    </p>
                  </div>
                  <button
                    onClick={() => openAddLocationModal(wh._id)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <Plus size={14} /> Add Rack / Location
                  </button>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    Storage Locations & Racks:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {wh.locations && wh.locations.length > 0 ? (
                      wh.locations.map((loc) => (
                        <div
                          key={loc._id}
                          className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 flex items-center gap-2"
                        >
                          <Layers size={13} className="text-indigo-500" />
                          <span className="font-semibold">{loc.name}</span>
                          <span className="font-mono text-[10px] text-gray-400 bg-white px-1 rounded border">
                            {loc.code}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No locations assigned yet</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Location Modal */}
      {showLocModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Add Rack / Location</h3>
              <button onClick={() => setShowLocModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Location Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shelf A-03 or Heavy Storage"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Location Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WH1/SHELF-A3"
                  value={locCode}
                  onChange={(e) => setLocCode(e.target.value.toUpperCase())}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Location Type *</label>
                <select
                  value={locType}
                  onChange={(e) => setLocType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="INTERNAL">Internal Storage (Physical Inventory)</option>
                  <option value="VENDOR">Vendor / Supplier (Virtual Origin)</option>
                  <option value="CUSTOMER">Customer (Virtual Destination)</option>
                  <option value="INVENTORY_LOSS">Inventory Loss / Scrap</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLocModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
