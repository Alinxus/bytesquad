'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, CreditCard, Star, Trash2, Menu, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-text-primary">Payout Accounts</h1>
          </div>
          <Button size="sm" onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl bg-surface border border-border p-5 animate-pulse">
                  <div className="h-4 bg-surface-2 rounded w-24 mb-3" />
                  <div className="h-6 bg-surface-2 rounded w-32 mb-2" />
                  <div className="h-3 bg-surface-2 rounded w-20" />
                </div>
              ))}
            </div>
          ) : !accounts || accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
                <CreditCard className="w-7 h-7 text-text-muted" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">No payout accounts</p>
              <p className="text-xs text-text-muted mb-4">Add a bank account to start withdrawing your earnings</p>
              <Button size="sm" onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4" />
                Add Bank Account
              </Button>
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
                      <p className="text-sm font-semibold text-text-primary truncate">{account.bankName}</p>
                      <p className="text-xs text-text-muted">{account.currency}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-xs text-text-muted">Account number</span>
                      <span className="text-xs font-mono text-text-primary">****{account.accountNumberLast4}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-text-muted">Account name</span>
                      <span className="text-xs text-text-primary truncate ml-2 text-right">{account.accountName}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!account.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        disabled
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-text-muted hover:text-error hover:bg-error/10"
                      onClick={() => {
                        if (confirm('Remove this bank account?')) {
                          deleteAccount.mutate(account.id)
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add Account Dialog */}
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
                    <SelectTrigger className={errors.bankCode ? 'border-error' : ''}>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {nigeriaBanks.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>{bank.name}</SelectItem>
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
                <p className="text-xs text-text-muted">Use this account for automatic payouts</p>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={createAccount.isPending} className="flex-1">
                Add Account
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
