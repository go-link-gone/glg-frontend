/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens (driven by CSS variables in index.css)
        background: v('background'),
        surface: v('surface'),
        'surface-bright': v('surface-bright'),
        'surface-dim': v('surface-dim'),
        'surface-variant': v('surface-variant'),
        'surface-container-lowest': v('surface-container-lowest'),
        'surface-container-low': v('surface-container-low'),
        'surface-container': v('surface-container'),
        'surface-container-high': v('surface-container-high'),
        'surface-container-highest': v('surface-container-highest'),
        'surface-tint': v('surface-tint'),
        'on-surface': v('on-surface'),
        'on-surface-variant': v('on-surface-variant'),
        'on-background': v('on-background'),
        outline: v('outline'),
        'outline-variant': v('outline-variant'),
        primary: v('primary'),
        'primary-container': v('primary-container'),
        'on-primary': v('on-primary'),
        'on-primary-container': v('on-primary-container'),
        'inverse-primary': v('inverse-primary'),
        secondary: v('secondary'),
        'secondary-container': v('secondary-container'),
        'on-secondary': v('on-secondary'),
        'on-secondary-container': v('on-secondary-container'),
        tertiary: v('tertiary'),
        'tertiary-container': v('tertiary-container'),
        'on-tertiary': v('on-tertiary'),
        'on-tertiary-container': v('on-tertiary-container'),
        error: v('error'),
        'error-container': v('error-container'),
        'on-error': v('on-error'),
        'on-error-container': v('on-error-container'),
        success: v('success'),
        'inverse-surface': v('inverse-surface'),
        'inverse-on-surface': v('inverse-on-surface'),

        // GoLinkGone brand accents (electric — matches the logo)
        'brand-cyan': v('brand-cyan'),
        'brand-blue': v('brand-blue'),
        'brand-purple': v('brand-purple'),
        'brand-ink': v('brand-ink'),

        // Static "fixed" tokens (kept identical in both themes by design)
        'primary-fixed': '#dbe1ff',
        'primary-fixed-dim': '#b4c5ff',
        'on-primary-fixed': '#00174b',
        'on-primary-fixed-variant': '#003ea8',
        'secondary-fixed': '#d3e4fe',
        'secondary-fixed-dim': '#b7c8e1',
        'on-secondary-fixed': '#0b1c30',
        'on-secondary-fixed-variant': '#38485d',
        'tertiary-fixed': '#6ffbbe',
        'tertiary-fixed-dim': '#4edea3',
        'on-tertiary-fixed': '#002113',
        'on-tertiary-fixed-variant': '#005236',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      spacing: {
        gutter: '24px',
        xs: '4px',
        md: '24px',
        base: '8px',
        sm: '12px',
        lg: '40px',
        xl: '64px',
        margin: '32px',
      },
      maxWidth: {
        'max-width': '1200px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'headline-lg-mobile': ['26px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'headline-md': ['22px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-lg': ['34px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'display-lg': ['48px', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-xl': ['64px', { lineHeight: '1.0', letterSpacing: '-0.035em', fontWeight: '800' }],
        'label-caps': ['11px', { lineHeight: '1.2', letterSpacing: '0.12em', fontWeight: '700' }],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        elevated:
          '0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px -8px rgba(15, 23, 42, 0.16), 0 16px 48px -16px rgba(15, 23, 42, 0.18)',
        'card-hover':
          '0 1px 2px rgba(15, 23, 42, 0.06), 0 6px 20px -8px rgba(15, 23, 42, 0.14)',
        'accent-sm': '0 1px 2px rgb(var(--c-primary) / 0.20)',
        accent: '0 4px 16px -4px rgb(var(--c-primary) / 0.35)',
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, rgb(var(--c-brand-cyan)) 0%, rgb(var(--c-brand-blue)) 52%, rgb(var(--c-brand-purple)) 100%)',
        'brand-gradient-soft':
          'linear-gradient(135deg, rgb(var(--c-brand-cyan) / 0.14) 0%, rgb(var(--c-brand-blue) / 0.14) 52%, rgb(var(--c-brand-purple) / 0.14) 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'rise-up': {
          '0%': { transform: 'translateY(12px)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'grow-x': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'rise-up': 'rise-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.4s ease both',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
