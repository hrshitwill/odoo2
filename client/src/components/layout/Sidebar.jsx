import React from 'react';
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
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
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
    { to: '/settings/warehouse', label: 'Warehouse & Settings', icon: Warehouse },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col min-h-screen">
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
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile & Logout Section */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300">
          <User size={18} className="text-indigo-400" />
          <div className="flex-1 truncate">
            <p className="font-medium text-white truncate">{user.name || 'User'}</p>
            <p className="text-xs text-slate-400 capitalize">{user.role ? user.role.toLowerCase().replace('_', ' ') : 'Staff'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
