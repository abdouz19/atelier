'use client';

import { create } from 'zustand';
import type { User } from '@/features/auth/auth.types';

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  sessionToken: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  currentUser: null,
  sessionToken: null,
  setAuth: (user, token) =>
    set({ isAuthenticated: true, currentUser: user, sessionToken: token }),
  clearAuth: () =>
    set({ isAuthenticated: false, currentUser: null, sessionToken: null }),
}));
