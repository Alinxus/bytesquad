'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { NButton } from '@/components/ui/NButton'
import { NInput } from '@/components/ui/NInput'
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
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {}
      <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-gold/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-[420px]">
        {}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="flex items-center gap-2 mb-4 group justify-center">
            <span className="text-2xl font-display font-bold text-primary tracking-tight">nera</span>
          </div>
          <h1 className="text-display mb-2">Welcome<br />back.</h1>
          <p className="text-ink-muted text-sm max-w-[280px]">
            Sign in to your professional workspace to manage your finances.
          </p>
        </div>

        {}
        <div className="nera-card p-10 bg-white/80 backdrop-blur-xl">
          {}
          {errors.root && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-bg border border-danger/20 mb-6 animate-shake">
              <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <p className="text-[13px] text-danger font-medium leading-snug flex-1">
                {errors.root.message}
              </p>
              <button
                type="button"
                onClick={() => clearErrors('root')}
                className="text-danger/40 hover:text-danger transition-colors shrink-0"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <NInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <NInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
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
              <div className="flex justify-end mt-1.5">
                <Link 
                  href="/forgot-password" 
                  className="text-[11px] font-bold text-primary uppercase tracking-wider hover:text-primary-mid transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <NButton
              type="submit"
              size="lg"
              className="w-full h-14"
              loading={isLoggingIn}
            >
              Log in <ArrowRight className="w-4 h-4 ml-2" />
            </NButton>
          </form>

          {}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold text-ink-hint bg-transparent">
              <span className="bg-white px-3">or continue with</span>
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
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-primary font-bold hover:text-primary-mid transition-colors"
              >
                Sign up free
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
