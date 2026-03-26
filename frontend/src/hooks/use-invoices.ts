'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '@/lib/api'
import type { CreateInvoiceRequest } from '@/types'
import { useToast } from '@/hooks/use-toast'

export const INVOICES_KEY = 'invoices'

export function useInvoices(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [INVOICES_KEY, params],
    queryFn: () => invoicesApi.list(params),
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: [INVOICES_KEY, id],
    queryFn: () => invoicesApi.get(id),
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateInvoiceRequest) => invoicesApi.create(data),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] })
      toast({
        title: 'Invoice created',
        description: `Invoice ${invoice.invoiceNumber} has been created successfully.`,
      })
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create invoice'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    },
  })
}

export function useVoidInvoice() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => invoicesApi.void(id),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] })
      toast({
        title: 'Invoice voided',
        description: `Invoice ${invoice.invoiceNumber} has been voided.`,
      })
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to void invoice'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    },
  })
}

export function useCreateCheckout() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (invoiceId: string) => invoicesApi.createCheckout(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] })
      toast({
        title: 'Checkout link created',
        description: 'The payment link has been generated successfully.',
      })
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create checkout link'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    },
  })
}
