'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types/inventory';
import { INITIAL_USER, SECONDARY_USER } from '@/lib/initialData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (name: string, email: string, role: UserRole) => Promise<boolean>;
  requestPasswordResetOtp: (email: string) => Promise<{ success: boolean; simulatedOtp: string }>;
  verifyOtpAndResetPassword: (email: string, otp: string, newPassword: string) => Promise<boolean>;
  logout: () => void;
  quickLoginAs: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'stocksense_auth_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(INITIAL_USER); // default logged in as Alex Vance for instant smooth demo
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedAuth) {
        setUser(JSON.parse(savedAuth));
      } else {
        // default initial session
        setUser(INITIAL_USER);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(INITIAL_USER));
      }
    } catch (e) {
      console.error('Failed to load auth', e);
    }
    setIsHydrated(true);
  }, []);

  const login = async (email: string, _password?: string): Promise<boolean> => {
    // Check if matching secondary user or initial user, or arbitrary valid email
    let matchedUser = INITIAL_USER;
    if (email.toLowerCase().includes('marcus') || email.toLowerCase().includes('staff')) {
      matchedUser = SECONDARY_USER;
    } else if (email) {
      matchedUser = {
        ...INITIAL_USER,
        email,
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      };
    }
    setUser(matchedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matchedUser));
    return true;
  };

  const signup = async (name: string, email: string, role: UserRole): Promise<boolean> => {
    const newUser: User = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name,
      email,
      role,
      department: role === 'inventory_manager' ? 'Central Logistics & Supply Operations' : 'Floor Execution & Fulfillment',
      warehouseId: role === 'inventory_manager' ? 'all' : 'wh-main',
      assignedWarehouseName: role === 'inventory_manager' ? 'All Warehouses' : 'Main Central Hub',
      avatar: name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    };
    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    return true;
  };

  const requestPasswordResetOtp = async (email: string) => {
    // Generate simulated 6-digit OTP
    const simulatedOtp = '849201';
    return { success: true, simulatedOtp };
  };

  const verifyOtpAndResetPassword = async (_email: string, otp: string, _newPass: string) => {
    if (otp.trim() === '849201' || otp.trim().length === 6) {
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
        isAuthenticated: !!user,
        login,
        signup,
        requestPasswordResetOtp,
        verifyOtpAndResetPassword,
        logout,
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
