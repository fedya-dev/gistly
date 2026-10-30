'use client'

import { create } from 'zustand'
import { fetchSession, loginRequest, logoutRequest } from '@/lib/api-client'

interface AuthState {
  isAdmin: boolean
  loaded: boolean
  refresh: () => Promise<void>
  login: (password: string) => Promise<boolean>
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  isAdmin: false,
  loaded: false,
  refresh: async () => {
    try {
      const { isAdmin } = await fetchSession()
      set({ isAdmin, loaded: true })
    } catch {
      set({ isAdmin: false, loaded: true })
    }
  },
  login: async (password: string) => {
    await loginRequest(password)
    set({ isAdmin: true, loaded: true })
    return true
  },
  logout: async () => {
    try {
      await logoutRequest()
    } finally {
      set({ isAdmin: false, loaded: true })
    }
  },
}))
