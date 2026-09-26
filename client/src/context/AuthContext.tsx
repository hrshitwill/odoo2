'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types/inventory';
import { INITIAL_USER, SECONDARY_USER } from '@/lib/initialData';

export interface RegisteredOperator {
  id: string;
  name: string;
  email: string;
  role: 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF';
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  provisionUser: (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => Promise<{ success: boolean; message: string }>;
  requestPasswordResetOtp: (
    email: string
  ) => Promise<{ success: boolean; message: string; debugOtp?: string }>;
  verifyOtpAndResetPassword: (
    email: string,
    otp: string,
    newPassword: string
  ) => Promise<{ success: boolean; message: string }>;
  fetchRegisteredOperators: () => Promise<RegisteredOperator[]>;
  revokeOperator: (userId: string) => Promise<{ success: boolean; message: string }>;
  updateOperator: (
    userId: string,
    data: { name?: string; role?: UserRole; password?: string }
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  quickFillCredentials: (role: UserRole) => { email: string; pass: string };
  quickLoginAs: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'stocksense_auth_session';
const TOKEN_STORAGE_KEY = 'stocksense_jwt_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (savedAuth) {
        setUser(JSON.parse(savedAuth));
      }
      if (savedToken) {
        setToken(savedToken);
      }
    } catch (e) {
      console.error('Failed to load stored auth session', e);
    }
    setIsHydrated(true);
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Invalid credentials. Access rejected.',
        };
      }

      // Convert backend uppercase role to client UserRole
      const clientRole: UserRole =
        data.user.role === 'INVENTORY_MANAGER' ? 'inventory_manager' : 'warehouse_staff';

      const authenticatedUser: User = {
        id: data.user.id || `usr-${Date.now().toString().slice(-4)}`,
        name: data.user.name,
        email: data.user.email,
        role: clientRole,
        department:
          clientRole === 'inventory_manager'
            ? 'Central Logistics & Supply Operations'
            : 'Floor Execution & Fulfillment',
        warehouseId: clientRole === 'inventory_manager' ? 'all' : 'wh-main',
        assignedWarehouseName:
          clientRole === 'inventory_manager' ? 'All Warehouses' : 'Main Central Hub',
        avatar: data.user.name
          .split(' ')
          .map((p: string) => p[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      };

      setUser(authenticatedUser);
      setToken(data.token);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message:
          err.message || 'Network communication failure with StockSense authentication server.',
      };
    }
  };

  const provisionUser = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const activeToken = token || localStorage.getItem(TOKEN_STORAGE_KEY);
      const backendRole =
        role === 'inventory_manager' ? 'INVENTORY_MANAGER' : 'WAREHOUSE_STAFF';

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: backendRole,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message:
            data.message || 'Authorization rejected: Failed to provision operator account.',
        };
      }

      return {
        success: true,
        message: data.message || `Operator ${name} provisioned successfully.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error connecting to user management server.',
      };
    }
  };

  const requestPasswordResetOtp = async (
    email: string
  ): Promise<{ success: boolean; message: string; debugOtp?: string }> => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message:
            data.message ||
            'No registered operator found with this email. Please contact an Inventory Manager for access.',
        };
      }

      return {
        success: true,
        message: data.message || `A 6-digit verification code was dispatched to ${email}.`,
        debugOtp: data.debugOtp,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Error connecting to authentication service.',
      };
    }
  };

  const verifyOtpAndResetPassword = async (
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Invalid or expired OTP verification code.',
        };
      }

      return {
        success: true,
        message: data.message || 'Password successfully updated.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Error resetting password.',
      };
    }
  };

  const fetchRegisteredOperators = async (): Promise<RegisteredOperator[]> => {
    try {
      const activeToken = token || localStorage.getItem(TOKEN_STORAGE_KEY);
      const res = await fetch('/api/auth/users', {
        headers: {
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        return data.data.map((u: any) => ({
          id: u._id || u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const revokeOperator = async (
    userId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const activeToken = token || localStorage.getItem(TOKEN_STORAGE_KEY);
      const res = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
      });

      const data = await res.json();
      return {
        success: res.ok && data.success,
        message:
          data.message || (res.ok ? 'Operator revoked.' : 'Failed to revoke operator access.'),
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error communicating with server.',
      };
    }
  };

  const updateOperator = async (
    userId: string,
    data: { name?: string; role?: UserRole; password?: string }
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const activeToken = token || localStorage.getItem(TOKEN_STORAGE_KEY);
      const backendRole = data.role
        ? data.role === 'inventory_manager'
          ? 'INVENTORY_MANAGER'
          : 'WAREHOUSE_STAFF'
        : undefined;

      const res = await fetch(`/api/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({
          name: data.name,
          role: backendRole,
          password: data.password,
        }),
      });

      const resData = await res.json();
      return {
        success: res.ok && resData.success,
        message:
          resData.message || (res.ok ? 'Operator updated successfully.' : 'Failed to update operator.'),
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error updating operator.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const quickFillCredentials = (role: UserRole) => {
    if (role === 'inventory_manager') {
      return { email: 'manager@stocksense.com', pass: 'admin123' };
    }
    return { email: 'staff@stocksense.com', pass: 'staff123' };
  };

  const quickLoginAs = (role: UserRole) => {
    const targetUser = role === 'inventory_manager' ? INITIAL_USER : SECONDARY_USER;
    setUser(targetUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(targetUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        provisionUser,
        requestPasswordResetOtp,
        verifyOtpAndResetPassword,
        fetchRegisteredOperators,
        revokeOperator,
        updateOperator,
        logout,
        quickFillCredentials,
        quickLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
