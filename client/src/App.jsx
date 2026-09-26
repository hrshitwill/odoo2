import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// App Pages
import Dashboard from './pages/dashboard/Dashboard';
import Products from './pages/products/Products';
import Receipts from './pages/operations/Receipts';
import Deliveries from './pages/operations/Deliveries';
import Transfers from './pages/operations/Transfers';
import Adjustments from './pages/operations/Adjustments';
import MoveHistory from './pages/operations/MoveHistory';
import WarehouseSettings from './pages/settings/WarehouseSettings';

// Protected Route Guard
function ProtectedLayout() {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected App Routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/operations/receipts" element={<Receipts />} />
        <Route path="/operations/deliveries" element={<Deliveries />} />
        <Route path="/operations/transfers" element={<Transfers />} />
        <Route path="/operations/adjustments" element={<Adjustments />} />
        <Route path="/operations/move-history" element={<MoveHistory />} />
        <Route path="/settings/warehouse" element={<WarehouseSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
