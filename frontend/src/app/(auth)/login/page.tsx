'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Zap, ArrowRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { extractApiError } from '@/lib/api'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoggingIn } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      await new Promise<void>((resolve, reject) => {
        login(data, {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        })
      })
    } catch (err: unknown) {
      const extracted = extractApiError(err)
      const message = extracted || 'Invalid email or password. Please try again.'
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

      <div className="relative w-full max-w-[400px] animate-fade-in">
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
            <h1 className="text-2xl font-bold text-text-primary mb-1.5">Welcome back</h1>
            <p className="text-text-secondary text-sm">Sign in to your account to continue</p>
          </div>

          {/* Root error alert */}
          {errors.root && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-error/8 border border-error/20 mb-5">
              <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-error leading-snug">{errors.root.message}</p>
              </div>
              <button
                type="button"
                onClick={() => clearErrors('root')}
                className="text-error/60 hover:text-error transition-colors shrink-0 text-lg leading-none"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                <p className="text-xs text-error flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-text-secondary">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  className={cn(
                    'pr-10',
                    errors.password ? 'border-error/60 focus-visible:border-error' : ''
                  )}
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
                <p className="text-xs text-error flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-1"
              loading={isLoggingIn}
            >
              Sign in
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 border-t border-border" />

          <p className="text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-accent-light hover:text-accent font-medium transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>

        {/* Below card tagline */}
        <p className="text-center text-xs text-text-muted mt-6">
          Secure payments for African freelancers
        </p>
      </div>
    </div>
  )
}

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
