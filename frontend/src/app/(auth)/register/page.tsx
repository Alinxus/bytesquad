'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Zap, ArrowRight, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      const apiError = (err as { response?: { data?: unknown } })?.response?.data
      const message =
        (apiError as { message?: string })?.message ||
        (apiError as { error?: string })?.error ||
        (Array.isArray((apiError as { errors?: Array<{ message?: string }> })?.errors)
          ? (apiError as { errors: Array<{ message?: string }> }).errors[0]?.message
          : null) ||
        extractApiError(err) ||
        'Registration failed. Check your details and try again.'
      setError('root', { message })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent-dark/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-accent/3 blur-[80px]" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#4F8EF7 1px, transparent 1px), linear-gradient(90deg, #4F8EF7 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative w-full max-w-[460px] my-8 animate-fade-in">
        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl shadow-black/60">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center shadow-lg shadow-accent/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-text-primary tracking-tight">Nera</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-text-primary mb-1.5">Create your account</h1>
            <p className="text-text-secondary text-sm">Get started in less than 2 minutes — free forever</p>
          </div>

          {/* Root error banner */}
          {errors.root && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-error/8 border-l-4 border-error mb-6">
              <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error flex-1 leading-snug">{errors.root.message}</p>
              <button
                type="button"
                onClick={() => clearErrors('root')}
                className="text-error/60 hover:text-error transition-colors shrink-0"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium text-text-secondary">
                Full name
              </Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                {...register('fullName')}
                className={errors.fullName ? 'border-error/60 focus-visible:border-error' : ''}
              />
              {errors.fullName && (
                <p className="text-xs text-error flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Business name */}
            <div className="space-y-1.5">
              <Label htmlFor="businessName" className="text-sm font-medium text-text-secondary">
                Business name
              </Label>
              <Input
                id="businessName"
                placeholder="Acme Studio"
                {...register('businessName')}
                className={errors.businessName ? 'border-error/60 focus-visible:border-error' : ''}
              />
              {errors.businessName && (
                <p className="text-xs text-error flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.businessName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-text-secondary">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
                className={errors.email ? 'border-error/60 focus-visible:border-error' : ''}
              />
              {errors.email && (
                <p className="text-xs text-error flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-text-secondary">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  {...register('password')}
                  className={
                    errors.password
                      ? 'border-error/60 focus-visible:border-error pr-10'
                      : 'pr-10'
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-error flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-text-secondary">Country</Label>
              <Select value={countryCode} onValueChange={(val) => setValue('countryCode', val)}>
                <SelectTrigger className={errors.countryCode ? 'border-error/60' : ''}>
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
                <p className="text-xs text-error flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.countryCode.message}
                </p>
              )}
            </div>

            {/* Base currency */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-text-secondary">Base currency</Label>
              <Select value={baseCurrency} onValueChange={(val) => setValue('baseCurrency', val)}>
                <SelectTrigger className={errors.baseCurrency ? 'border-error/60' : ''}>
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
                <p className="text-xs text-error flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.baseCurrency.message}
                </p>
              )}
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={isRegistering}
              >
                Create account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-center text-xs text-text-muted pt-1">
              By creating an account, you agree to our{' '}
              <span className="text-accent-light cursor-pointer hover:underline">Terms of Service</span>{' '}
              and{' '}
              <span className="text-accent-light cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </form>

          {/* Divider */}
          <div className="my-6 border-t border-border" />

          <p className="text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-accent-light hover:text-accent font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Secure payments for African freelancers
        </p>
      </div>
    </div>
  )
}
