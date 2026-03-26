import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        background: '#070B14',
        surface: '#0D1220',
        'surface-2': '#131929',
        'surface-3': '#1A2235',
        border: '#1E2C44',
        'border-light': '#243550',
        'text-primary': '#F0F4FF',
        'text-secondary': '#8899BB',
        'text-muted': '#4A5980',
        accent: '#4F8EF7',
        'accent-light': '#7AACFF',
        'accent-dark': '#2563EB',
        success: '#22C55E',
        'success-light': '#4ADE80',
        error: '#F43F5E',
        'error-light': '#FB7185',
        warning: '#FB923C',
        'warning-light': '#FDBA74',
        // shadcn compat
        foreground: '#F0F4FF',
        card: { DEFAULT: '#0D1220', foreground: '#F0F4FF' },
        popover: { DEFAULT: '#131929', foreground: '#F0F4FF' },
        primary: { DEFAULT: '#4F8EF7', foreground: '#FFFFFF' },
        secondary: { DEFAULT: '#131929', foreground: '#F0F4FF' },
        muted: { DEFAULT: '#131929', foreground: '#8899BB' },
        destructive: { DEFAULT: '#F43F5E', foreground: '#FFFFFF' },
        input: '#1E2C44',
        ring: '#4F8EF7',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200px 0' },
          to: { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        shimmer: 'shimmer 1.5s infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'accent-gradient': 'linear-gradient(135deg, #3B74E0 0%, #7AACFF 100%)',
        'card-gradient': 'linear-gradient(135deg, #131929 0%, #0D1220 100%)',
        'hero-gradient': 'linear-gradient(135deg, #0D1220 0%, #070B14 50%, #0A1030 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
