'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/lib/api'
import type { CreateCustomerRequest } from '@/types'
import { useToast } from '@/hooks/use-toast'

export const CUSTOMERS_KEY = 'customers'

export function useCustomers(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, params],
    queryFn: () => customersApi.list(params),
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, id],
    queryFn: () => customersApi.get(id),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => customersApi.create(data),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
      toast({
        title: 'Customer added',
        description: `${customer.name} has been added successfully.`,
      })
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create customer'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
      toast({
        title: 'Customer removed',
        description: 'The customer has been deleted.',
      })
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to delete customer'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    },
  })
}
