import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Workspace, AuthResponse } from '@/types'
import { setTokens, clearTokens } from '@/lib/api'

interface AuthState {
  user: User | null
  workspace: Workspace | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  // Actions
  setAuth: (data: AuthResponse) => void
  updateWorkspace: (workspace: Workspace) => void
  updateUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      workspace: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (data: AuthResponse) => {
        const { user, workspace, accessToken, refreshToken } = data
        // Also store in localStorage for axios interceptors
        setTokens(accessToken, refreshToken)
        set({
          user,
          workspace,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })
      },

      updateWorkspace: (workspace: Workspace) => {
        set({ workspace })
      },

      updateUser: (user: User) => {
        set({ user })
      },

      clearAuth: () => {
        clearTokens()
        set({
          user: null,
          workspace: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'nera-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        workspace: state.workspace,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Sync tokens to localStorage for axios interceptors on rehydration
        if (state?.accessToken && state?.refreshToken) {
          setTokens(state.accessToken, state.refreshToken)
        }
      },
    }
  )
)
