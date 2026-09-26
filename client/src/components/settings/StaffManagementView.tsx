'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserRound,
  Mail,
  Lock,
  Search,
  Filter,
  CircleCheck,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Edit2,
  Warehouse,
  KeyRound,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth, RegisteredOperator } from '@/context/AuthContext';
import { useInventory } from '@/context/InventoryContext';
import { UserRole } from '@/types/inventory';
import { Modal } from '@/components/common/Modal';

export const StaffManagementView: React.FC = () => {
  const { user, provisionUser, fetchRegisteredOperators, revokeOperator, updateOperator } = useAuth();
  const { warehouses } = useInventory();

  const [operators, setOperators] = useState<RegisteredOperator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'WAREHOUSE_STAFF' | 'INVENTORY_MANAGER'>('ALL');
  const [statusAlert, setStatusAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Provision Modal State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('warehouse_staff');
  const [assignedWhName, setAssignedWhName] = useState(warehouses[0]?.name || 'Main Central Hub');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<RegisteredOperator | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('warehouse_staff');
  const [editPassword, setEditPassword] = useState('');

  const loadOperators = async () => {
    setIsLoading(true);
    const list = await fetchRegisteredOperators();
    setOperators(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadOperators();
  }, []);

  const filteredOperators = useMemo(() => {
    return operators.filter((op) => {
      const matchesSearch =
        op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || op.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [operators, searchQuery, roleFilter]);

  const staffCount = operators.filter((o) => o.role === 'WAREHOUSE_STAFF').length;
  const managerCount = operators.filter((o) => o.role === 'INVENTORY_MANAGER').length;

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;

    if (newPassword.length < 6) {
      setStatusAlert({
        type: 'error',
        text: 'Initial security password must be at least 6 characters long.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusAlert(null);

    const res = await provisionUser(newName, newEmail, newPassword, newRole);
    setIsSubmitting(false);

    if (res.success) {
      setStatusAlert({
        type: 'success',
        text: `New ${newRole === 'inventory_manager' ? 'Manager' : 'Staff'} "${newName}" successfully provisioned! Credentials active for login.`,
      });
      setIsProvisionModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('warehouse_staff');
      loadOperators();
    } else {
      setStatusAlert({
        type: 'error',
        text: res.message || 'Failed to provision staff account.',
      });
    }
  };

  const handleOpenEdit = (op: RegisteredOperator) => {
    setEditingOperator(op);
    setEditName(op.name);
    setEditRole(op.role === 'INVENTORY_MANAGER' ? 'inventory_manager' : 'warehouse_staff');
    setEditPassword('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOperator) return;

    setIsSubmitting(true);
    const res = await updateOperator(editingOperator.id, {
      name: editName,
      role: editRole,
      password: editPassword || undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      setStatusAlert({
        type: 'success',
        text: `Operator ${editingOperator.email} updated successfully.`,
      });
      setIsEditModalOpen(false);
      loadOperators();
    } else {
      setStatusAlert({
        type: 'error',
        text: res.message || 'Failed to update operator.',
      });
    }
  };

  const handleRevoke = async (op: RegisteredOperator) => {
    if (confirm(`Revoke warehouse system access for ${op.name} (${op.email})?`)) {
      const res = await revokeOperator(op.id);
      if (res.success) {
        setStatusAlert({
          type: 'success',
          text: `Revoked access for ${op.email}.`,
        });
        loadOperators();
      } else {
        setStatusAlert({
          type: 'error',
          text: res.message || 'Failed to revoke access.',
        });
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-[11px] font-sans uppercase tracking-wider text-slate-500 font-semibold mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
            <span>Administrative Supervisory Portal</span>
          </div>
          <h1 className="text-page-title text-slate-950">
            Staff &amp; Personnel Administration
          </h1>
          <p className="text-sm text-slate-600 font-sans mt-0.5">
            Manage warehouse staff, assign operational facilities, and provision new operator credentials
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadOperators}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-sans font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Personnel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProvisionModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-sans font-medium transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>Provision New Staff</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusAlert && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-sans flex items-start gap-2.5 ${
            statusAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {statusAlert.type === 'success' ? (
            <CircleCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{statusAlert.text}</div>
          <button
            type="button"
            onClick={() => setStatusAlert(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans text-slate-500 uppercase tracking-wider font-semibold">
              Total Personnel
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {operators.length}
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-1">
            Registered in central MongoDB directory
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans text-blue-700 uppercase tracking-wider font-semibold">
              Warehouse Staff
            </span>
            <UserRound className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-900 mt-2">
            {staffCount}
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-1">
            Restricted to warehouse execution tasks
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans text-orange-700 uppercase tracking-wider font-semibold">
              Inventory Managers
            </span>
            <Shield className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-orange-900 mt-2">
            {managerCount}
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-1">
            Full supervisory &amp; staff provisioning access
          </div>
        </div>

        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans text-emerald-400 uppercase tracking-wider font-semibold">
              RBAC Status
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold font-sans text-white mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Enforced</span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-1">
            Staff strictly blocked from Manager portals
          </div>
        </div>
      </div>

      {/* Staff Directory Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-sans">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Filter Role:</span>
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setRoleFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  roleFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({operators.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('WAREHOUSE_STAFF')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  roleFilter === 'WAREHOUSE_STAFF'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Staff ({staffCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('INVENTORY_MANAGER')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  roleFilter === 'INVENTORY_MANAGER'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Managers ({managerCount})
              </button>
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role &amp; Permissions</th>
                <th className="py-3 px-4">Facility Access Scope</th>
                <th className="py-3 px-4">Provisioned</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    {isLoading ? 'Loading staff roster...' : 'No staff members match the selected filter.'}
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op) => {
                  const isManager = op.role === 'INVENTORY_MANAGER';
                  const isCurrentUser = user?.email.toLowerCase() === op.email.toLowerCase();

                  return (
                    <tr key={op.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isManager
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {op.name
                              .split(' ')
                              .map((p) => p[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{op.name}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] text-emerald-600 font-medium font-sans">
                                ● Current Active Manager
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {op.email}
                      </td>

                      <td className="py-3.5 px-4">
                        {isManager ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                            <Shield className="w-3 h-3 text-orange-600" />
                            <span>Inventory Manager</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            <UserRound className="w-3 h-3 text-blue-600" />
                            <span>Warehouse Staff</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {isManager ? (
                          <span className="font-medium text-slate-900 flex items-center gap-1">
                            <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                            <span>All Warehouses (Global Master Access)</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 flex items-center gap-1">
                            <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                            <span>Operations &amp; Floor Execution (Main Hub)</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {op.createdAt ? new Date(op.createdAt).toLocaleDateString() : 'System Seeded'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(op)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {isCurrentUser ? (
                            <span className="text-[10px] text-slate-400 italic">Protected</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRevoke(op)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Provision New Staff Member */}
      <Modal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        title="Provision New Warehouse Staff / Operator"
      >
        <form onSubmit={handleProvisionSubmit} className="space-y-4">
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-950 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Manager Administrative Authority:</strong> You are provisioning credentials for warehouse personnel. Staff will be strictly restricted to warehouse operations and cannot access manager portals.
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Staff Full Name *
            </label>
            <div className="relative">
              <UserRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Lucas Grey"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Official Email Address (Login Username) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="lucas.grey@stocksense.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
              Initial Security Password * (min 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter initial password"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Assigned Operational Role *
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="warehouse_staff">Warehouse Staff (Picking, Packing, Counting, Scanner)</option>
                <option value="inventory_manager">Inventory Manager (Full Master Data &amp; Staff Supervision)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Assigned Primary Facility
              </label>
              <select
                value={assignedWhName}
                onChange={(e) => setAssignedWhName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.name}>
                    {w.name} [{w.code}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsProvisionModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-sans font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg text-xs font-sans font-medium shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Provision Staff Member</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Edit Staff Role & Permissions */}
      {editingOperator && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Personnel: ${editingOperator.name}`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Registered Email
              </label>
              <input
                type="email"
                disabled
                value={editingOperator.email}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Operational Role &amp; Permission Level
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="warehouse_staff">Warehouse Staff (Restricted to Floor Execution)</option>
                <option value="inventory_manager">Inventory Manager (Central Administration &amp; Master Data)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-sans font-medium uppercase tracking-wider text-slate-600 mb-1">
                Reset Password (Optional — leave blank to keep current)
              </label>
              <input
                type="password"
                minLength={6}
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Leave blank or enter new password"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-sans font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-sans font-medium shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Saving Updates...' : 'Save Personnel Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
