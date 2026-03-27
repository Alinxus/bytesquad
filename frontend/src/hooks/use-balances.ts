'use client'

import { useQuery } from '@tanstack/react-query'
import { balancesApi } from '@/lib/api'

export const BALANCES_KEY = 'balances'

export function useBalances() {
  return useQuery({
    queryKey: [BALANCES_KEY],
    queryFn: () => balancesApi.list(),
    refetchInterval: 30 * 1000, 
  })
}

