'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowRight, AlertCircle, X } from 'lucide-react'
import { NButton } from '@/components/ui/NButton'
import { NInput } from '@/components/ui/NInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { extractApiError } from '@/lib/api'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  businessName: z.string().min(2, 'Business name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  countryCode: z.string().min(2, 'Please select your country'),
  baseCurrency: z.string().min(3, 'Please select your base currency'),
})

type RegisterForm = z.infer<typeof registerSchema>

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
  { value: 'GHS', label: 'GHS — Ghanaian Cedi' },
  { value: 'KES', label: 'KES — Kenyan Shilling' },
]

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, isRegistering } = useAuth()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    setError,
    clearErrors,
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      countryCode: 'NG',
      baseCurrency: 'NGN',
    },
  })

  const countryCode = watch('countryCode')
  const baseCurrency = watch('baseCurrency')

  const onSubmit = async (data: RegisterForm) => {
    try {
      await new Promise<void>((resolve, reject) => {
        registerUser(data, {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        })
      })
    } catch (err: unknown) {
      const extracted = extractApiError(err)
      const message = extracted || 'Registration failed. Please check your details.'
      setError('root', { message })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {}
      <div className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-gold/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-[500px] my-12">
        {}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="flex items-center gap-2 mb-4 group justify-center">
            <span className="text-2xl font-display font-bold text-primary tracking-tight">nera</span>
          </div>
          <h1 className="text-display mb-2 text-3xl">Professional accounts<br />for creators.</h1>
          <p className="text-ink-muted text-sm max-w-[320px]">
            Join the elite network of African freelancers getting paid globally.
          </p>
        </div>

        {}
        <div className="nera-card p-10 bg-white/80 backdrop-blur-xl">
          {}
          {errors.root && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-bg border border-danger/20 mb-8 animate-shake">
              <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <p className="text-[13px] text-danger font-medium leading-snug flex-1">
                {errors.root.message}
              </p>
              <button
                type="button"
                onClick={() => clearErrors('root')}
                className="text-danger/40 hover:text-danger transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NInput
                label="Full Name"
                placeholder="John Doe"
                error={errors.fullName?.message}
                {...register('fullName')}
              />
              <NInput
                label="Business Name"
                placeholder="Acme Studio"
                error={errors.businessName?.message}
                {...register('businessName')}
              />
            </div>

            <NInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <NInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2 block font-display">
                  Country
                </label>
                <Select value={countryCode} onValueChange={(val) => setValue('countryCode', val)}>
                  <SelectTrigger className={cn("h-12 rounded-xl", errors.countryCode ? "border-danger" : "border-border")}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.countryCode && (
                  <p className="text-xs text-danger mt-1 font-sans">{errors.countryCode.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2 block font-display">
                  Base Currency
                </label>
                <Select value={baseCurrency} onValueChange={(val) => setValue('baseCurrency', val)}>
                  <SelectTrigger className={cn("h-12 rounded-xl", errors.baseCurrency ? "border-danger" : "border-border")}>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.baseCurrency && (
                  <p className="text-xs text-danger mt-1 font-sans">{errors.baseCurrency.message}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <NButton
                type="submit"
                size="lg"
                className="w-full h-14"
                loading={isRegistering}
              >
                Create free account <ArrowRight className="w-4 h-4 ml-2" />
              </NButton>
            </div>

            <p className="text-center text-[11px] text-ink-hint leading-relaxed uppercase tracking-wider">
              By creating an account, you agree to our<br />
              <span className="text-primary cursor-pointer hover:underline font-bold">Terms of Service</span>
              {' & '}
              <span className="text-primary cursor-pointer hover:underline font-bold">Privacy Policy</span>
            </p>
          </form>

          {}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold text-ink-hint bg-transparent">
              <span className="bg-white px-3">or join with</span>
            </div>
          </div>

          <NButton 
            variant="outline" 
            className="w-full h-12 gap-3"
            onClick={() => {}}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.706c-.18-.54-.282-1.114-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.551 0 9s.347 2.823.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.057.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Google
          </NButton>

          <div className="mt-8 text-center">
            <p className="text-sm text-ink-muted">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary font-bold hover:text-primary-mid transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {}
        <p className="text-center text-[11px] font-bold text-ink-hint uppercase tracking-[0.2em] mt-10">
          Professional Payments for Creators
        </p>
      </div>
    </div>
  )
}

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
