'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Menu, UserPlus, Mail, Building2, Globe, ArrowRight, Users } from 'lucide-react'
import Link from 'next/link'
import { NButton } from '@/components/ui/NButton'
import { NInput } from '@/components/ui/NInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sidebar } from '@/components/layout/sidebar'
import { useCreateCustomer } from '@/hooks/use-customers'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  companyName: z.string().optional(),
  countryCode: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const countries = [
  { value: 'NG', label: '🇳🇬 Nigeria' },
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'GH', label: '🇬🇭 Ghana' },
  { value: 'KE', label: '🇰🇪 Kenya' },
  { value: 'ZA', label: '🇿🇦 South Africa' },
  { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'FR', label: '🇫🇷 France' },
]

export default function NewCustomerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const createCustomer = useCreateCustomer()

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      companyName: '',
      countryCode: ''
    }
  })

  const onSubmit = async (data: FormData) => {
    await createCustomer.mutateAsync(data)
    router.push('/customers')
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
               className="lg:hidden p-2 rounded-xl text-ink-hint hover:text-ink hover:bg-surface transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-ink-hint hover:text-ink transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center group-hover:border-ink/20 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Back</span>
            </button>
          </div>
          <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-ink-hint">
             Identity Registration
          </h1>
          <div className="w-20" /> {}
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12 animate-fade-in relative">
          <div className="max-w-xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <div className="w-20 h-20 rounded-[2.5rem] bg-navy flex items-center justify-center mx-auto mb-6 shadow-xl shadow-navy/20 group hover:scale-110 transition-transform duration-500">
                <UserPlus className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-display text-4xl mb-3">Add Customer.</h2>
              <p className="text-ink-muted text-sm max-w-[360px] mx-auto leading-relaxed">
                Onboard a new global client to your professional network and start generating capital flows.
              </p>
            </div>

            <div className="nera-card p-10 bg-white/90 backdrop-blur-xl shadow-2xl shadow-navy/5">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 gap-8">
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <NInput
                        label="Primary Legal Name / Contact"
                        placeholder="Johnathan Doe"
                        leftIcon={<Users className="w-4 h-4" />}
                        error={errors.name?.message}
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <NInput
                        label="Electronic Mail Address"
                        type="email"
                        placeholder="john@global-corp.io"
                        leftIcon={<Mail className="w-4 h-4" />}
                        error={errors.email?.message}
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    name="companyName"
                    control={control}
                    render={({ field }) => (
                      <NInput
                        label="Corporate Entity / Trading Name"
                        placeholder="Acme International"
                        leftIcon={<Building2 className="w-4 h-4" />}
                        helperText="Required if billing a business entity"
                        {...field}
                      />
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2 block font-display">
                      Geographic Region
                    </label>
                    <Controller
                      name="countryCode"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-14 rounded-xl border-border bg-surface relative">
                             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-hint">
                                <Globe size={18} />
                             </div>
                             <div className="pl-8">
                                <SelectValue placeholder="Select primary region" />
                             </div>
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((c) => (
                              <SelectItem key={c.value} value={c.value} className="py-3 font-bold">
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <NButton 
                    type="submit" 
                    loading={createCustomer.isPending} 
                    className="flex-1 h-16 rounded-2xl shadow-xl shadow-primary/10 group"
                  >
                    Register Customer <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </NButton>
                  <Link href="/customers" className="flex-1">
                    <NButton type="button" variant="outline" className="w-full h-16 rounded-2xl bg-white">
                      Discard
                    </NButton>
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
