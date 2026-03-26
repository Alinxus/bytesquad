'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { withdrawalsApi, payoutAccountsApi } from '@/lib/api'
import type { CreateWithdrawalRequest, CreatePayoutAccountRequest } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { BALANCES_KEY } from './use-balances'

export const WITHDRAWALS_KEY = 'withdrawals'
export const PAYOUT_ACCOUNTS_KEY = 'payout-accounts'

export function useWithdrawals(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [WITHDRAWALS_KEY, params],
    queryFn: () => withdrawalsApi.list(params),
  })
}

export function useWithdrawal(id: string) {
  return useQuery({
    queryKey: [WITHDRAWALS_KEY, id],
    queryFn: () => withdrawalsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateWithdrawalRequest) => withdrawalsApi.create(data),
    onSuccess: (withdrawal) => {
      queryClient.invalidateQueries({ queryKey: [WITHDRAWALS_KEY] })
      queryClient.invalidateQueries({ queryKey: [BALANCES_KEY] })
      toast({
        title: 'Withdrawal requested',
        description: `Your withdrawal of ${(withdrawal.amountMinor / 100).toFixed(2)} ${withdrawal.currency} is being processed.`,
      })
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create withdrawal'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    },
  })
}

export function usePayoutAccounts() {
  return useQuery({
    queryKey: [PAYOUT_ACCOUNTS_KEY],
    queryFn: () => payoutAccountsApi.list(),
  })
}

export function useCreatePayoutAccount() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreatePayoutAccountRequest) => payoutAccountsApi.create(data),
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: [PAYOUT_ACCOUNTS_KEY] })
      toast({
        title: 'Bank account added',
        description: `${account.bankName} account ending in ${account.accountNumberLast4} has been added.`,
      })
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to add bank account'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    },
  })
}


export function useDeletePayoutAccount() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => payoutAccountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAYOUT_ACCOUNTS_KEY] })
      toast({
        title: 'Account removed',
        description: 'The bank account has been removed.',
      })
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to remove account'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    },
  })
}
