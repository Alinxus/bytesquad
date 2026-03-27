'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, CreditCard, Star, Trash2, Menu, CheckCircle2 } from 'lucide-react'
import { NButton } from '@/components/ui/NButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sidebar } from '@/components/layout/sidebar'
import { usePayoutAccounts, useCreatePayoutAccount, useDeletePayoutAccount } from '@/hooks/use-withdrawals'
import { maskAccountNumber } from '@/lib/utils'

const schema = z.object({
  bankCode: z.string().min(1, 'Bank code is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(10, 'Enter a valid account number'),
  isDefault: z.boolean().default(false),
})

type FormData = z.infer<typeof schema>

const nigeriaBanks = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank' },
  { code: '050', name: 'EcoBank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '526', name: 'Parallex Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'SunTrust Bank' },
  { code: '032', name: 'Union Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
]

export default function PayoutAccountsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [isDefault, setIsDefault] = useState(false)

  const { data: accounts, isLoading } = usePayoutAccounts()
  const createAccount = useCreatePayoutAccount()
  const deleteAccount = useDeletePayoutAccount()
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isDefault: false },
  })

  const bankCode = watch('bankCode')

  const onSubmit = async (data: FormData) => {
    await createAccount.mutateAsync({ ...data, countryCode: 'NG', currency: 'NGN', isDefault })
    setShowDialog(false)
    reset()
    setIsDefault(false)
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-ink">Payout Accounts</h1>
          </div>
          <NButton size="sm" onClick={() => setShowDialog(true)} className="h-10 px-6 rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </NButton>
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl bg-surface border border-border p-5 animate-pulse">
                  <div className="h-4 bg-surface rounded w-24 mb-3" />
                  <div className="h-6 bg-surface rounded w-32 mb-2" />
                  <div className="h-3 bg-surface rounded w-20" />
                </div>
              ))}
            </div>
          ) : !accounts || accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-surface/30 rounded-3xl border-2 border-dashed border-border mb-12 animate-fade-in">
              <div className="w-24 h-24 rounded-[2rem] bg-white border-2 border-border flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500">
                <CreditCard className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-2xl font-display font-bold text-ink mb-3 tracking-tight">No payout endpoints.</h3>
              <p className="text-sm text-ink-muted mb-10 max-w-[340px] leading-relaxed mx-auto">
                Connect your business settlement account to begin relaying liquidity from your Nera balances.
              </p>
              <NButton 
                onClick={() => setShowDialog(true)}
                className="rounded-2xl px-10 h-14 shadow-xl shadow-primary/20 group h-14"
              >
                <Plus className="w-5 h-5 mr-3 transition-transform group-hover:rotate-90" />
                Add Bank Account
              </NButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="relative rounded-xl bg-surface border border-border p-5 hover:border-border-light transition-all group"
                >
                  {account.isDefault && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-success/10 border border-success/20 rounded-full px-2 py-0.5">
                      <Star className="w-3 h-3 text-success fill-success" />
                      <span className="text-xs text-success font-medium">Default</span>
                    </div>
                  )}

                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-accent-light" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{account.bankName}</p>
                      <p className="text-xs text-ink-muted">{account.currency}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-xs text-ink-muted">Account number</span>
                      <span className="text-xs font-mono text-ink">****{account.accountNumberLast4}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-ink-muted">Account name</span>
                      <span className="text-xs text-ink truncate ml-2 text-right">{account.accountName}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {!account.isDefault ? (
                      <NButton
                        variant="ghost"
                        className="flex-1 text-[10px] font-bold uppercase tracking-widest h-10 border border-border hover:bg-surface text-ink-muted"
                        disabled
                      >
                        Set Default
                      </NButton>
                    ) : (
                      <div className="flex-1" />
                    )}
                    <NButton
                      variant="ghost"
                      className="w-10 h-10 p-0 text-ink-muted hover:text-danger hover:bg-danger/5 border border-transparent hover:border-danger/10 flex items-center justify-center shrink-0"
                      onClick={() => {
                        if (confirm('Remove this bank account?')) {
                          deleteAccount.mutate(account.id)
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </NButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>
              Add a Nigerian bank account to receive withdrawals.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Bank *</Label>
              <Controller
                name="bankCode"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val)
                      const bank = nigeriaBanks.find((b) => b.code === val)
                      if (bank) setValue('bankName', bank.name)
                    }}
                  >
                    <SelectTrigger className={cn("h-14 rounded-2xl", errors.bankCode ? 'border-danger' : 'border-border')}>
                      <SelectValue placeholder="Select institution" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-2xl">
                      {nigeriaBanks.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code} className="py-3">
                          <span className="font-bold text-ink">{bank.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.bankCode && <p className="text-xs text-error">{errors.bankCode.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                placeholder="0123456789"
                maxLength={10}
                {...register('accountNumber')}
                className={errors.accountNumber ? 'border-error' : ''}
              />
              {errors.accountNumber && <p className="text-xs text-error">{errors.accountNumber.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="accountName">Account Name *</Label>
              <Input
                id="accountName"
                placeholder="John Doe"
                {...register('accountName')}
                className={errors.accountName ? 'border-error' : ''}
              />
              {errors.accountName && <p className="text-xs text-error">{errors.accountName.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Set as default</Label>
                <p className="text-xs text-ink-muted">Use this account for automatic payouts</p>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>

            <div className="flex gap-3 pt-4">
              <NButton type="submit" loading={createAccount.isPending} className="flex-1 h-14 rounded-2xl shadow-lg">
                Register Account
              </NButton>
              <NButton type="button" variant="ghost" onClick={() => setShowDialog(false)} className="flex-1 h-14 rounded-2xl text-ink-muted">
                Cancel
              </NButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
