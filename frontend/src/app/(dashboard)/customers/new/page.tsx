'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Menu } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sidebar } from '@/components/layout/sidebar'
import { useCreateCustomer } from '@/hooks/use-customers'

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
  const [countryCode, setCountryCode] = useState('')
  const router = useRouter()
  const createCustomer = useCreateCustomer()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    await createCustomer.mutateAsync({
      ...data,
      countryCode: countryCode || undefined,
    })
    router.push('/customers')
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
          <Link href="/customers" className="text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-text-primary">Add Customer</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <div className="max-w-lg mx-auto">
            <div className="rounded-xl bg-surface border border-border p-6">
              <p className="text-sm text-text-secondary mb-6">
                Add a customer to send invoices and collect payments.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Jane Smith"
                    {...register('name')}
                    className={errors.name ? 'border-error' : ''}
                  />
                  {errors.name && <p className="text-xs text-error">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@company.com"
                    {...register('email')}
                    className={errors.email ? 'border-error' : ''}
                  />
                  {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyName">Company Name <span className="text-text-muted">(optional)</span></Label>
                  <Input
                    id="companyName"
                    placeholder="Acme Corp"
                    {...register('companyName')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Country <span className="text-text-muted">(optional)</span></Label>
                  <Select value={countryCode} onValueChange={(val) => { setCountryCode(val); setValue('countryCode', val) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" loading={createCustomer.isPending} className="flex-1">
                    Add Customer
                  </Button>
                  <Link href="/customers" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
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
