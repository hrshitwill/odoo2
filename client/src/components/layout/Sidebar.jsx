import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  Warehouse,
  User,
  LogOut,
  X,
  Shield,
  Mail,
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/operations/receipts', label: 'Receipts', icon: ArrowDownLeft },
    { to: '/operations/deliveries', label: 'Delivery Orders', icon: ArrowUpRight },
    { to: '/operations/transfers', label: 'Internal Transfers', icon: ArrowLeftRight },
    { to: '/operations/adjustments', label: 'Inventory Adjustment', icon: SlidersHorizontal },
    { to: '/operations/move-history', label: 'Move History', icon: History },
    { to: '/settings/warehouse', label: 'Setting (Warehouse)', icon: Warehouse },
  ];

  return (
    <>
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col min-h-screen shrink-0 border-r border-slate-800">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="p-1.5 bg-indigo-600 rounded-lg text-white">📦</span>
            StockSense
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Logout Section (Left Sidebar Profile Menu) */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
              <User size={16} />
            </div>
            <div className="flex-1 truncate">
              <p className="font-semibold text-white truncate">{user.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                {user.role ? user.role.replace('_', ' ') : 'Staff'}
              </p>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* My Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">My Profile</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                  <User size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{user.name}</h4>
                  <span className="text-[11px] font-mono text-indigo-600 font-semibold">{user.email}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-indigo-600" />
                  <span>Assigned Role: <strong className="text-gray-800">{user.role}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-indigo-600" />
                  <span>Access Tier: {user.role === 'INVENTORY_MANAGER' ? 'Full Manager Permissions' : 'Operational Floor Access'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleLogout}
                className="text-xs text-red-600 font-semibold hover:underline"
              >
                Sign out of device
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
