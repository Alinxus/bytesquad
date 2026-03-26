'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ArrowUpRight, CreditCard, Menu } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sidebar } from '@/components/layout/sidebar'
import { useCreateWithdrawal, usePayoutAccounts } from '@/hooks/use-withdrawals'
import { useBalances } from '@/hooks/use-balances'
import { formatCurrency, toMinorUnits, getCurrencySymbol, maskAccountNumber } from '@/lib/utils'

const schema = z.object({
  payoutAccountId: z.string().min(1, 'Please select a payout account'),
  currency: z.string().min(3, 'Please select a currency'),
  amount: z.number({ invalid_type_error: 'Enter a valid amount' }).positive('Amount must be positive'),
})

type FormData = z.infer<typeof schema>

export default function NewWithdrawalPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [formData, setFormData] = useState<FormData | null>(null)
  const router = useRouter()

  const createWithdrawal = useCreateWithdrawal()
  const { data: payoutAccounts } = usePayoutAccounts()
  const { data: balances } = useBalances()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'NGN' },
  })

  const currency = watch('currency')
  const payoutAccountId = watch('payoutAccountId')
  const balance = balances?.find((b) => b.currency === currency)
  const selectedAccount = payoutAccounts?.find((a) => a.id === payoutAccountId)

  const onSubmit = (data: FormData) => {
    setFormData(data)
    setStep('confirm')
  }

  const handleConfirm = async () => {
    if (!formData) return
    await createWithdrawal.mutateAsync({
      payoutAccountId: formData.payoutAccountId,
      currency: formData.currency,
      amountMinor: toMinorUnits(formData.amount),
    })
    router.push('/withdrawals')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center gap-4 h-16 px-6 bg-background/80 backdrop-blur-md border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => step === 'confirm' ? setStep('form') : router.back()}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-text-primary">
            {step === 'form' ? 'Request Withdrawal' : 'Confirm Withdrawal'}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <div className="max-w-md mx-auto">
            {step === 'form' ? (
              <>
                {/* Balance display */}
                {balance && (
                  <div className="rounded-xl bg-surface-2 border border-border p-4 mb-6">
                    <p className="text-xs text-text-muted mb-1">Available Balance ({currency})</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {formatCurrency(balance.availableMinor, currency)}
                    </p>
                  </div>
                )}

                <div className="rounded-xl bg-surface border border-border p-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                              {['NGN', 'USD', 'GBP', 'EUR'].map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="amount">Amount *</Label>
                      <Controller
                        name="amount"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            prefix={getCurrencySymbol(currency)}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            className={errors.amount ? 'border-error' : ''}
                          />
                        )}
                      />
                      {errors.amount && <p className="text-xs text-error">{errors.amount.message}</p>}
                      {balance && (
                        <Controller
                          name="amount"
                          control={control}
                          render={({ field }) => (
                            <button
                              type="button"
                              className="text-xs text-accent-light hover:text-accent transition-colors"
                              onClick={() => field.onChange(balance.availableMinor / 100)}
                            >
                              Use max: {formatCurrency(balance.availableMinor, currency)}
                            </button>
                          )}
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label>Payout Account *</Label>
                        <Link href="/payout-accounts" className="text-xs text-accent-light hover:text-accent transition-colors">
                          Manage accounts
                        </Link>
                      </div>
                      <Controller
                        name="payoutAccountId"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className={errors.payoutAccountId ? 'border-error' : ''}>
                              <SelectValue placeholder="Select bank account" />
                            </SelectTrigger>
                            <SelectContent>
                              {!payoutAccounts || payoutAccounts.length === 0 ? (
                                <div className="py-4 text-center text-xs text-text-muted">
                                  No payout accounts.{' '}
                                  <Link href="/payout-accounts" className="text-accent-light hover:underline">
                                    Add one
                                  </Link>
                                </div>
                              ) : (
                                payoutAccounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.bankName} · ****{account.accountNumberLast4}
                                    {account.isDefault && ' (Default)'}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.payoutAccountId && <p className="text-xs text-error">{errors.payoutAccountId.message}</p>}
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                      Review Withdrawal
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              /* Confirmation step */
              <div className="rounded-xl bg-surface border border-border p-6 space-y-5">
                <div className="text-center pb-4 border-b border-border">
                  <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-3">
                    <ArrowUpRight className="w-7 h-7 text-accent-light" />
                  </div>
                  <p className="text-3xl font-bold text-text-primary mb-1">
                    {formData && formatCurrency(toMinorUnits(formData.amount), formData.currency)}
                  </p>
                  <p className="text-sm text-text-muted">Withdrawal amount</p>
                </div>

                {selectedAccount && (
                  <div className="rounded-lg bg-surface-2 border border-border p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-4 h-4 text-text-muted" />
                      <p className="text-xs font-medium text-text-muted uppercase tracking-wider">To Account</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Bank</span>
                      <span className="text-text-primary font-medium">{selectedAccount.bankName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Account</span>
                      <span className="text-text-primary font-mono">****{selectedAccount.accountNumberLast4}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Name</span>
                      <span className="text-text-primary">{selectedAccount.accountName}</span>
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-warning/5 border border-warning/20 p-3">
                  <p className="text-xs text-warning/80">
                    Withdrawals are typically processed within 1-2 business days. Ensure your account details are correct before proceeding.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setStep('form')}
                  >
                    Back
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={handleConfirm}
                    loading={createWithdrawal.isPending}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
