'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/lib/api'
import type { LoginRequest, RegisterRequest } from '@/types'
import { useToast } from '@/hooks/use-toast'

export function useAuth() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, workspace, isAuthenticated, setAuth, clearAuth, updateWorkspace, updateUser } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      setAuth(data)
      toast({
        title: 'Welcome back!',
        description: `Signed in as ${data.user.email}`,
      })
      router.push('/')
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid email or password'
      toast({
        title: 'Login failed',
        description: message,
        variant: 'destructive',
      })
    },
  })

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data) => {
      setAuth(data)
      toast({
        title: 'Account created!',
        description: `Welcome to Nera, ${data.user.fullName}`,
      })
      router.push('/')
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed. Please try again.'
      toast({
        title: 'Registration failed',
        description: message,
        variant: 'destructive',
      })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth()
      router.push('/login')
    },
  })

  return {
    user,
    workspace,
    isAuthenticated,
    updateWorkspace,
    updateUser,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    clearAuth,
  }
}
