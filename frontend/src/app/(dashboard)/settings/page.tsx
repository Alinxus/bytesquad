'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Menu, Save, User, Landmark, ShieldCheck, ArrowRight, Zap, Info, Building2, Globe, Banknote } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { NButton } from '@/components/ui/NButton'
import { NInput } from '@/components/ui/NInput'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sidebar } from '@/components/layout/sidebar'
import { workspaceApi } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const profileSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  countryCode: z.string().min(2, 'Select a country'),
  baseCurrency: z.string().min(3, 'Select a currency'),
})

type ProfileFormData = z.infer<typeof profileSchema>

const countries = [
  { value: 'NG', label: '🇳🇬 Nigeria' },
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'GH', label: '🇬🇭 Ghana' },
  { value: 'KE', label: '🇰🇪 Kenya' },
]

const currencies = [
  { value: 'NGN', label: 'NGN — Nigerian Naira' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'EUR', label: 'EUR — Euro' },
]

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [autoSettle, setAutoSettle] = useState(false)
  const { workspace, updateWorkspace, user } = useAuth()
  const { toast } = useToast()

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: workspace?.businessName || '',
      countryCode: workspace?.countryCode || 'NG',
      baseCurrency: workspace?.baseCurrency || 'NGN',
    },
  })

  useEffect(() => {
    if (workspace) {
      reset({
        businessName: workspace.businessName,
        countryCode: workspace.countryCode,
        baseCurrency: workspace.baseCurrency,
      })
      setAutoSettle(workspace.autoSettleEnabled)
    }
  }, [workspace, reset])

  const updateProfile = useMutation({
    mutationFn: (data: ProfileFormData) => workspaceApi.update(data),
    onSuccess: (updatedWorkspace) => {
      updateWorkspace(updatedWorkspace)
      toast({ title: 'Configuration synchronized', description: 'Your business profile has been updated.' })
    },
    onError: () => {
      toast({ title: 'Synchronization failed', description: 'Unable to update workspace settings.', variant: 'destructive' })
    },
  })

  const updateSettlement = useMutation({
    mutationFn: (enabled: boolean) =>
      workspaceApi.updateSettlement({
        payoutMode: enabled ? 'AUTO_SETTLE' : 'HOLD_BALANCE',
        autoSettleEnabled: enabled,
      }),
    onSuccess: (updatedWorkspace) => {
      updateWorkspace(updatedWorkspace)
      toast({ title: 'Liquidity protocol updated' })
    },
    onError: () => {
      toast({ title: 'Protocol error', description: 'Failed to update settlement configuration.', variant: 'destructive' })
    },
  })

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-ink">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {}
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-8 bg-white/80 backdrop-blur-xl border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <button
               onClick={() => setSidebarOpen(true)}
               className="lg:hidden p-2 rounded-xl text-ink-hint hover:text-ink hover:bg-surface transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-display font-bold text-ink tracking-tight">System Configuration</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface rounded-xl border border-border">
             <ShieldCheck size={14} className="text-primary" />
             <span className="text-[10px] font-bold text-ink-hint uppercase tracking-widest">Workspace Verified</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12 animate-fade-in relative">
          <div className="max-w-3xl mx-auto relative z-10">
            <Tabs defaultValue="profile" className="space-y-10">
              <TabsList className="bg-surface p-1.5 rounded-2xl h-16 w-full max-w-md mx-auto grid grid-cols-2 shadow-sm border border-border">
                <TabsTrigger 
                  value="profile" 
                  className="rounded-xl font-display font-bold uppercase tracking-widest text-[11px] data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all"
                >
                  <User size={14} className="mr-2" /> Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="settlement" 
                  className="rounded-xl font-display font-bold uppercase tracking-widest text-[11px] data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all"
                >
                  <Landmark size={14} className="mr-2" /> Settlement
                </TabsTrigger>
              </TabsList>

              {}
              <TabsContent value="profile" className="focus-visible:outline-none">
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-navy flex items-center justify-center shadow-xl shadow-navy/20">
                        <Building2 className="w-8 h-8 text-white" />
                     </div>
                     <div>
                        <h2 className="text-2xl font-display font-bold text-ink tracking-tight">Business Profile</h2>
                        <p className="text-sm text-ink-muted">Control your commercial identity and financial base region.</p>
                     </div>
                  </div>

                  <div className="nera-card p-10 bg-white/60 backdrop-blur-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12 p-8 rounded-2xl bg-surface/50 border border-border/50">
                      <div>
                        <p className="text-[10px] font-bold text-ink-hint uppercase tracking-[0.2em] mb-1.5">Administrative lead</p>
                        <p className="font-display font-bold text-ink text-lg">{user?.fullName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-ink-hint uppercase tracking-[0.2em] mb-1.5">Authorized email address</p>
                        <p className="font-bold text-primary tabular-nums underline decoration-primary/20 decoration-2 underline-offset-4">{user?.email}</p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit((data) => updateProfile.mutate(data))} className="space-y-8">
                      <Controller
                        name="businessName"
                        control={control}
                        render={({ field }) => (
                          <NInput
                            label="Legal entity / Business trademark"
                            placeholder="Acme Global Ventures"
                            leftIcon={<Building2 size={16} />}
                            error={errors.businessName?.message}
                            {...field}
                          />
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2 block font-display">
                            Operation Center
                          </label>
                          <Controller
                            name="countryCode"
                            control={control}
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="h-14 rounded-xl border-border bg-surface relative px-10">
                                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-hint">
                                      <Globe size={18} />
                                   </div>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {countries.map((c) => (
                                    <SelectItem key={c.value} value={c.value} className="font-bold py-3">{c.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2 block font-display">
                            Base Currency
                          </label>
                          <Controller
                            name="baseCurrency"
                            control={control}
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="h-14 rounded-xl border-border bg-surface relative px-10">
                                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-hint">
                                      <Banknote size={18} />
                                   </div>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {currencies.map((c) => (
                                    <SelectItem key={c.value} value={c.value} className="font-bold py-3">{c.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <NButton 
                          type="submit" 
                          loading={updateProfile.isPending} 
                          disabled={!isDirty}
                          className="w-full sm:w-auto px-10 h-14 rounded-xl group shadow-lg shadow-primary/10"
                        >
                          Synchronize Identity <Save className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform" />
                        </NButton>
                      </div>
                    </form>
                  </div>
                </div>
              </TabsContent>

              {}
              <TabsContent value="settlement" className="focus-visible:outline-none">
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-navy flex items-center justify-center shadow-xl shadow-navy/20">
                        <Landmark className="w-8 h-8 text-white" />
                     </div>
                     <div>
                        <h2 className="text-2xl font-display font-bold text-ink tracking-tight">Settlement Protocol</h2>
                        <p className="text-sm text-ink-muted">Configure your automated capital liquidation parameters.</p>
                     </div>
                  </div>

                  <div className="nera-card p-10 bg-white/60 backdrop-blur-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 p-8 rounded-2xl bg-surface border border-border relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />
                      
                      <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                           <Zap size={18} className={cn("transition-colors duration-500", autoSettle ? "text-primary" : "text-ink-hint")} />
                           <p className="text-lg font-display font-bold text-ink">Automated Liquidation</p>
                        </div>
                        <p className="text-sm text-ink-muted max-w-sm leading-relaxed">
                          Synchronize your available balance with your verified payout account every 24 hours.
                        </p>
                      </div>
                      <Switch
                        checked={autoSettle}
                        onCheckedChange={setAutoSettle}
                        className="data-[state=checked]:bg-primary relative z-10 scale-125 mr-2"
                      />
                    </div>

                    <div className="mt-8 space-y-8">
                      {autoSettle ? (
                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex gap-4">
                           <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                           <div>
                              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-1">Active Protocol</p>
                              <p className="text-sm text-ink-muted leading-relaxed">
                                Requires a verified default payout account. System processes automated transfers at 23:00 WAT daily via the global clearing network.
                              </p>
                           </div>
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-surface-2 border border-border flex gap-4">
                           <Landmark className="w-5 h-5 text-ink-hint shrink-0 mt-0.5" />
                           <div>
                              <p className="text-[11px] font-bold text-ink-hint uppercase tracking-widest mb-1">Manual Treasury</p>
                              <p className="text-sm text-ink-muted leading-relaxed">
                                Assets will remain in your Nera vault. You maintain full control over the timing of manual capital withdrawals to your regional accounts.
                              </p>
                           </div>
                        </div>
                      )}

                      <NButton
                        onClick={() => updateSettlement.mutate(autoSettle)}
                        loading={updateSettlement.isPending}
                        className="w-full sm:w-auto px-10 h-14 rounded-xl group shadow-lg shadow-primary/10"
                      >
                        Authorize Settlement <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </NButton>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
