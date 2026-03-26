'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Menu } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sidebar } from '@/components/layout/sidebar'
import { useCreateInvoice } from '@/hooks/use-invoices'
import { useCustomers } from '@/hooks/use-customers'
import { toMinorUnits, getCurrencySymbol } from '@/lib/utils'

const schema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  currency: z.string().min(3, 'Please select a currency'),
  amountDue: z.number({ invalid_type_error: 'Please enter a valid amount' }).positive('Amount must be greater than 0'),
  dueDate: z.string().optional(),
  allowedMethods: z.array(z.string()).optional(),
})

type FormData = z.infer<typeof schema>

const currencies = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES']

const paymentMethods = [
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'USSD', label: 'USSD' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
]

export default function NewInvoicePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const createInvoice = useCreateInvoice()
  const { data: customersData } = useCustomers()
  const customers = customersData?.items || []

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: 'NGN',
      allowedMethods: ['CARD', 'BANK_TRANSFER'],
    },
  })

  const currency = watch('currency')

  const onSubmit = async (data: FormData) => {
    const { amountDue, allowedMethods, ...rest } = data
    const result = await createInvoice.mutateAsync({
      ...rest,
      amountMinor: toMinorUnits(amountDue),
      allowedMethods: (allowedMethods || []) as ('CARD' | 'BANK_TRANSFER' | 'USSD' | 'MOBILE_MONEY')[],
    })
    router.push(`/invoices/${result.id}`)
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 flex items-center gap-4 h-16 px-6 bg-background/80 backdrop-blur-md border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/invoices" className="text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-text-primary">Create Invoice</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Left: Invoice Details */}
              <div className="lg:col-span-2 space-y-5">
                <div className="rounded-xl bg-surface border border-border p-5 space-y-5">
                  <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Invoice Details</h2>

                  <div className="space-y-1.5">
                    <Label htmlFor="title">Invoice Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Website Design Project"
                      {...register('title')}
                      className={errors.title ? 'border-error' : ''}
                    />
                    {errors.title && <p className="text-xs text-error">{errors.title.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the work or services..."
                      rows={3}
                      {...register('description')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Currency *</Label>
                      <Controller
                        name="currency"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="amountDue">Amount *</Label>
                      <Controller
                        name="amountDue"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="amountDue"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            prefix={getCurrencySymbol(currency)}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            className={errors.amountDue ? 'border-error' : ''}
                          />
                        )}
                      />
                      {errors.amountDue && <p className="text-xs text-error">{errors.amountDue.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      {...register('dueDate')}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Customer & Settings */}
              <div className="space-y-5">
                {/* Customer */}
                <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
                  <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Customer</h2>

                  <div className="space-y-1.5">
                    <Label>Select Customer *</Label>
                    <Controller
                      name="customerId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={errors.customerId ? 'border-error' : ''}>
                            <SelectValue placeholder="Choose a customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.length === 0 ? (
                              <div className="py-4 text-center text-xs text-text-muted">
                                No customers yet.{' '}
                                <Link href="/customers/new" className="text-accent-light hover:underline">
                                  Add one
                                </Link>
                              </div>
                            ) : (
                              customers.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name} — {c.email}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.customerId && <p className="text-xs text-error">{errors.customerId.message}</p>}
                  </div>

                  <Link href="/customers/new" className="text-xs text-accent-light hover:text-accent transition-colors">
                    + Create new customer
                  </Link>
                </div>

                {/* Payment Methods */}
                <div className="rounded-xl bg-surface border border-border p-5 space-y-3">
                  <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Payment Methods</h2>
                  {paymentMethods.map((method) => (
                    <label key={method.value} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        value={method.value}
                        {...register('allowedMethods')}
                        className="w-4 h-4 rounded border-border bg-surface-2 accent-accent focus:ring-accent"
                      />
                      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                        {method.label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={createInvoice.isPending}
                >
                  Create Invoice
                </Button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
