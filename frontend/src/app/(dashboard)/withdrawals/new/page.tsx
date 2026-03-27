'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ArrowDown, CreditCard, Menu, Wallet, Landmark, Info, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { NButton } from '@/components/ui/NButton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sidebar } from '@/components/layout/sidebar'
import { useCreateWithdrawal, usePayoutAccounts } from '@/hooks/use-withdrawals'
import { useBalances } from '@/hooks/use-balances'
import { formatCurrency, toMinorUnits, cn } from '@/lib/utils'

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
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'USD', amount: 0 },
  })

  const currency = watch('currency')
  const amount = watch('amount')
  const payoutAccountId = watch('payoutAccountId')
  const balance = balances?.find((b) => b.currency === currency)
  const selectedAccount = payoutAccounts?.find((a) => a.id === payoutAccountId)

  
  const exchangeRate = 1600
  const estimatedNaira = (amount || 0) * exchangeRate

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
    <div className="flex h-screen bg-background overflow-hidden font-sans text-ink">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {}
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-8 bg-white/80 backdrop-blur-xl border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => step === 'confirm' ? setStep('form') : router.back()}
              className="flex items-center gap-2 text-ink-muted hover:text-ink transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center group-hover:border-ink/20 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Back</span>
            </button>
          </div>
          <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-ink-muted">
            {step === 'form' ? 'Request Payout' : 'Final Authorization'}
          </h1>
          <div className="w-20" />
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12 animate-fade-in relative">
          <div className="max-w-xl mx-auto relative z-10">
            {step === 'form' ? (
              <div className="space-y-8">
                <div className="text-center mb-10">
                  <h2 className="text-display text-4xl mb-3">Push liquidity.</h2>
                  <p className="text-ink-muted text-sm max-w-[320px] mx-auto">
                    Transfer your earned capital to your primary settlement account instantly.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {}
                  <div className="relative">
                    {}
                    <div className="nera-card p-6 bg-white border-2 border-border focus-within:border-primary transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">You send</span>
                        {balance && (
                          <button
                            type="button"
                            className="text-[10px] font-semibold text-primary hover:text-primary-mid transition-colors"
                            onClick={() => setValue('amount', balance.availableMinor / 100)}
                          >
                            Use Max: {formatCurrency(balance.availableMinor, currency)}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Controller
                          name="amount"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="flex-1 bg-transparent border-none p-0 text-3xl font-display font-bold text-ink focus:ring-0 placeholder:text-ink-hint"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          )}
                        />
                        <Controller
                          name="currency"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-24 h-10 rounded-lg border-none bg-surface font-bold text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD"><span className="mr-2">🇺🇸</span> USD</SelectItem>
                                <SelectItem value="GBP"><span className="mr-2">🇬🇧</span> GBP</SelectItem>
                                <SelectItem value="EUR"><span className="mr-2">🇪🇺</span> EUR</SelectItem>
                                <SelectItem value="NGN"><span className="mr-2">🇳🇬</span> NGN</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    {}
                    <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                      <div className="w-10 h-10 rounded-full bg-primary-light border-4 border-background flex items-center justify-center text-primary shadow-sm hover:scale-110 transition-transform cursor-pointer">
                        <ArrowDown className="w-5 h-5" />
                      </div>
                    </div>

                    {}
                    <div className="nera-card p-6 bg-surface border-2 border-transparent mt-2">
                       <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">They receive (Estimated)</span>
                        <span className="text-[10px] font-bold text-ink-muted">Rate: 1 {currency} = ₦{exchangeRate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <p className="text-3xl font-display font-bold text-success tabular-nums">
                           ₦{estimatedNaira.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </p>
                         <div className="px-4 py-1.5 rounded-lg bg-white border border-border flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-success" />
                            <span className="text-sm font-bold text-ink">NGN</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-ink-muted uppercase tracking-[0.15em] ml-1">
                      Settlement Endpoint
                    </label>
                    <Controller
                      name="payoutAccountId"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-1 gap-3">
                          {payoutAccounts?.map((account) => (
                            <button
                              key={account.id}
                              type="button"
                              onClick={() => field.onChange(account.id)}
                              className={cn(
                                "nera-card p-5 flex items-center justify-between transition-all group text-left",
                                field.value === account.id 
                                  ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                  : "hover:border-border-mid bg-white"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                  field.value === account.id ? "bg-primary text-white" : "bg-surface text-ink-hint group-hover:bg-primary/10 group-hover:text-primary"
                                )}>
                                  <Landmark className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="font-display font-bold text-ink text-sm uppercase tracking-tight">{account.bankName}</p>
                                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mt-0.5">****{account.accountNumberLast4} · {account.accountName}</p>
                                </div>
                              </div>
                              <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                field.value === account.id ? "border-primary bg-primary" : "border-border-mid"
                              )}>
                                {field.value === account.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                              </div>
                            </button>
                          ))}
                          <Link 
                            href="/payout-accounts"
                            className="nera-card p-5 border-dashed border-2 flex items-center justify-center gap-3 text-ink-muted hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all group"
                          >
                            <CreditCard className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Link new endpoint</span>
                          </Link>
                        </div>
                      )}
                    />
                    {errors.payoutAccountId && <p className="text-xs text-danger mt-1 font-bold ml-1">{errors.payoutAccountId.message}</p>}
                  </div>

                  <div className="pt-4">
                    <NButton type="submit" size="lg" className="h-16 w-full rounded-2xl shadow-xl shadow-primary/10 group">
                      Review Transfer Request
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </NButton>
                  </div>
                </form>

                <div className="flex items-start gap-4 p-6 rounded-2xl bg-surface border border-border">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-ink-muted leading-relaxed">
                     Withdrawals are processed via regional clearing houses. Standard arrival window is <span className="text-ink font-bold">24-48 hours</span> based on your banking institution. 1.5% fee included.
                  </p>
                </div>
              </div>
            ) : (
              
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-10">
                  <h2 className="text-display text-4xl mb-3 font-bold">Authorization.</h2>
                  <p className="text-ink-muted text-sm max-w-[320px] mx-auto leading-relaxed">
                    Final verification before bank transfer. Ensure destination details are correct to avoid relay delays.
                  </p>
                </div>

                <div className="nera-card p-0 bg-white shadow-[0_32px_80px_rgba(0,0,0,0.1)] overflow-hidden rounded-[2.5rem] border-none">
                  <div className="bg-navy p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.3em] mb-4">Transfer Volume</p>
                      <p className="text-display text-6xl font-bold text-white tracking-tighter">
                        {formData && formatCurrency(toMinorUnits(formData.amount), formData.currency)}
                      </p>
                      <div className="inline-flex items-center gap-2 mt-8 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
                         <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                         <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Liquidity Verified</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-10 space-y-10">
                    {selectedAccount && (
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-[10px] font-bold text-ink-hint uppercase tracking-[0.2em] mb-6">Target Settlement Destination</h4>
                          <div className="space-y-5">
                            <div className="flex justify-between items-center group">
                              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Institution</span>
                              <span className="font-display font-bold text-ink text-base group-hover:text-primary transition-colors">{selectedAccount.bankName}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Account Number</span>
                              <span className="font-display font-bold text-ink text-lg tracking-widest">****{selectedAccount.accountNumberLast4}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Legal Name</span>
                              <span className="font-display font-bold text-ink text-sm group-hover:text-primary transition-colors">{selectedAccount.accountName}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Estimated Receipt</span>
                              <span className="font-display font-bold text-success text-xl">₦{estimatedNaira.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-4">
                      <NButton
                        className="h-16 rounded-2xl shadow-xl shadow-primary/20 font-bold text-lg"
                        onClick={handleConfirm}
                        loading={createWithdrawal.isPending}
                      >
                        Authorize Relay
                      </NButton>
                      <NButton
                        variant="ghost"
                        className="h-10 text-ink-muted hover:text-ink font-bold uppercase tracking-widest text-[10px]"
                        onClick={() => setStep('form')}
                      >
                        Correction
                      </NButton>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
