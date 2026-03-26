'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Menu, Save } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sidebar } from '@/components/layout/sidebar'
import { workspaceApi } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

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
    register,
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
      toast({ title: 'Settings saved', description: 'Your profile has been updated.' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update settings.', variant: 'destructive' })
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
      toast({ title: 'Settlement settings saved' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update settlement settings.', variant: 'destructive' })
    },
  })

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
          <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <div className="max-w-2xl mx-auto">
            <Tabs defaultValue="profile">
              <TabsList className="mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="settlement">Settlement</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <div className="rounded-xl bg-surface border border-border p-6 space-y-5">
                  <div>
                    <h2 className="text-base font-semibold text-text-primary">Business Profile</h2>
                    <p className="text-sm text-text-secondary mt-0.5">Update your business information</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-surface-2 border border-border">
                    <div>
                      <Label className="text-xs">Full Name</Label>
                      <p className="text-sm text-text-primary mt-1">{user?.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <p className="text-sm text-text-primary mt-1">{user?.email}</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit((data) => updateProfile.mutate(data))} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        {...register('businessName')}
                        className={errors.businessName ? 'border-error' : ''}
                      />
                      {errors.businessName && <p className="text-xs text-error">{errors.businessName.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Country *</Label>
                        <Controller
                          name="countryCode"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Base Currency *</Label>
                        <Controller
                          name="baseCurrency"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {currencies.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    <Button type="submit" loading={updateProfile.isPending} disabled={!isDirty}>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </form>
                </div>
              </TabsContent>

              {/* Settlement Tab */}
              <TabsContent value="settlement">
                <div className="rounded-xl bg-surface border border-border p-6 space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-text-primary">Settlement Settings</h2>
                    <p className="text-sm text-text-secondary mt-0.5">Configure how you receive payments</p>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-border">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Auto Settlement</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Automatically transfer your available balance to your default payout account daily
                      </p>
                    </div>
                    <Switch
                      checked={autoSettle}
                      onCheckedChange={setAutoSettle}
                    />
                  </div>

                  {autoSettle && (
                    <div className="rounded-lg bg-warning/5 border border-warning/20 p-3">
                      <p className="text-xs text-warning/80">
                        Requires a verified default payout account. Transfers are processed at 11 PM WAT daily.
                      </p>
                    </div>
                  )}

                  {!autoSettle && (
                    <div className="rounded-lg bg-surface-2 border border-border p-3">
                      <p className="text-xs text-text-muted">
                        Payments will be held in your Nera balance. You can withdraw manually at any time.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => updateSettlement.mutate(autoSettle)}
                    loading={updateSettlement.isPending}
                  >
                    <Save className="w-4 h-4" />
                    Save Settlement Settings
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
