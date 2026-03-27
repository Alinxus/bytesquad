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
        background: '#FFFFFF',
        navy: {
          DEFAULT: '#08102B',
          mid: '#0E1A3D',
          surface: '#131F4A',
          border: '#1E2E5E',
        },
        primary: {
          DEFAULT: '#1B4FFF',
          mid: '#1440D4',
          light: '#EEF3FF',
          foreground: '#FFFFFF',
        },
        gold: {
          DEFAULT: '#F5C842',
          muted: '#F5C84220',
        },
        ink: {
          DEFAULT: '#06090F',
          mid: '#3D4460',
          muted: '#6B7490',
          hint: '#9EA5C0',
        },
        surface: '#F8F9FC',
        border: '#E8EAF0',
        'border-mid': '#D1D5E0',
        success: '#00C48C',
        'success-bg': '#E6FBF5',
        warning: '#FFAB00',
        'warning-bg': '#FFF8E6',
        danger: '#FF4D4F',
        'danger-bg': '#FFF1F1',
        
        foreground: '#06090F',
        card: { DEFAULT: '#FFFFFF', foreground: '#06090F' },
        popover: { DEFAULT: '#FFFFFF', foreground: '#06090F' },
        secondary: { DEFAULT: '#F8F9FC', foreground: '#06090F' },
        muted: { DEFAULT: '#F8F9FC', foreground: '#6B7490' },
        destructive: { DEFAULT: '#FF4D4F', foreground: '#FFFFFF' },
        input: '#E8EAF0',
        ring: '#1B4FFF',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
        sans: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
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
