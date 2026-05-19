import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import BrandMark from '../components/BrandMark';
import { useTheme } from '../contexts/ThemeContext';

const LIGHT_AUTH_COLORS = {
  brand: '#2a4cff',
  brandAccent: '#00d4ff',
  brandButtonText: '#ffffff',
  defaultButtonBackground: '#ffffff',
  defaultButtonBackgroundHover: '#f2f4f6',
  defaultButtonBorder: '#c3c6d7',
  defaultButtonText: '#191c1e',
  inputBackground: '#ffffff',
  inputBorder: '#c3c6d7',
  inputBorderHover: '#737686',
  inputBorderFocus: '#2a4cff',
  inputText: '#191c1e',
  inputLabelText: '#505f76',
  inputPlaceholder: '#737686',
  messageBackground: '#eceef0',
  messageText: '#191c1e',
  messageBackgroundDanger: '#ffdad6',
  messageTextDanger: '#93000a',
  anchorTextColor: '#2a4cff',
  anchorTextHoverColor: '#00d4ff',
  dividerBackground: '#c3c6d7',
};

const DARK_AUTH_COLORS = {
  brand: '#5c7aff',
  brandAccent: '#38e0ff',
  brandButtonText: '#ffffff',
  defaultButtonBackground: '#1c2024',
  defaultButtonBackgroundHover: '#26292d',
  defaultButtonBorder: '#43474e',
  defaultButtonText: '#e1e3e5',
  inputBackground: '#0a0e12',
  inputBorder: '#43474e',
  inputBorderHover: '#8d9199',
  inputBorderFocus: '#5c7aff',
  inputText: '#e1e3e5',
  inputLabelText: '#b7c8e1',
  inputPlaceholder: '#8d9199',
  messageBackground: '#1c2024',
  messageText: '#e1e3e5',
  messageBackgroundDanger: '#93000a',
  messageTextDanger: '#ffdad6',
  anchorTextColor: '#5c7aff',
  anchorTextHoverColor: '#38e0ff',
  dividerBackground: '#43474e',
};

export default function AuthPage() {
  const redirectTo = `${window.location.origin}/`;
  const { theme } = useTheme();
  const colors = theme === 'dark' ? DARK_AUTH_COLORS : LIGHT_AUTH_COLORS;
  const gridLine = theme === 'dark' ? '#43474e' : '#c3c6d7';

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Ambient gradient blobs */}
      <div
        aria-hidden
        className="brand-blob animate-float-slow"
        style={{
          width: 520,
          height: 520,
          left: -120,
          top: -80,
          background: 'radial-gradient(circle, rgb(var(--c-brand-cyan) / 0.55), transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="brand-blob animate-float-slower"
        style={{
          width: 600,
          height: 600,
          right: -180,
          top: 120,
          background: 'radial-gradient(circle, rgb(var(--c-brand-purple) / 0.45), transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="brand-blob animate-float-slow"
        style={{
          width: 460,
          height: 460,
          left: '38%',
          bottom: -160,
          background: 'radial-gradient(circle, rgb(var(--c-brand-blue) / 0.55), transparent 60%)',
        }}
      />

      {/* Brand stripe */}
      <header className="relative z-10 w-full border-b border-outline-variant/60 bg-surface-container-lowest/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-max-width items-center justify-between px-gutter">
          <BrandMark size={44} />
          <div className="flex items-center gap-3">
            <a
              href="mailto:support@golinkgone.com?subject=Sign-in%20help"
              className="hidden text-body-sm text-secondary hover:text-on-surface transition-colors md:inline"
            >
              Need help signing in?
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-gutter py-margin">
        {/* Decorative grid (sits over the blobs) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage:
              `linear-gradient(${gridLine} 1px, transparent 1px), linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
            maskImage:
              'radial-gradient(ellipse at center, black 35%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center, black 35%, transparent 75%)',
          }}
        />

        <div className="relative grid w-full max-w-5xl gap-margin md:grid-cols-2">
          {/* Left: marketing column */}
          <div className="hidden flex-col justify-center md:flex">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest/80 px-3 py-1 text-label-caps uppercase tracking-wider text-secondary shadow-soft backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Built for performance marketers
            </div>
            <h1 className="mt-md text-display-lg font-extrabold leading-[1.05] tracking-tight text-on-surface">
              Shorter links.<br />
              <span className="brand-shimmer">Smarter insights.</span>
            </h1>
            <p className="mt-sm max-w-md text-body-lg text-on-surface-variant">
              GoLinkGone shrinks any URL into a fast, trackable short link with
              a built-in QR code — and gives you per-click analytics across
              country, city, and device.
            </p>
            <ul className="mt-md space-y-3 text-body-md text-on-surface-variant">
              {[
                ['bolt', 'Sub-second redirects, every time'],
                ['public', 'Country & city level geo intelligence'],
                ['devices', 'Device breakdown, deduped visitors'],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {icon}
                    </span>
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: auth card */}
          <div className="brand-border rounded-2xl bg-surface-container-lowest/80 p-lg shadow-elevated backdrop-blur-xl md:p-margin">
            <h2 className="text-headline-md font-bold text-on-surface">
              Welcome back
            </h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Sign in to manage your links and view analytics.
            </p>
            <div className="mt-md">
              <Auth
                key={theme}
                supabaseClient={supabase}
                providers={['google', 'github']}
                redirectTo={redirectTo}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors,
                      fonts: {
                        bodyFontFamily: 'Inter, sans-serif',
                        buttonFontFamily: 'Inter, sans-serif',
                        labelFontFamily: 'Inter, sans-serif',
                        inputFontFamily: 'Inter, sans-serif',
                      },
                      radii: {
                        borderRadiusButton: '0.5rem',
                        buttonBorderRadius: '0.5rem',
                        inputBorderRadius: '0.5rem',
                      },
                    },
                  },
                }}
                localization={{
                  variables: {
                    sign_in: {
                      email_label: 'Email address',
                      password_label: 'Password',
                      button_label: 'Sign in',
                    },
                    sign_up: {
                      email_label: 'Email address',
                      password_label: 'Create a password',
                      button_label: 'Create account',
                    },
                    forgotten_password: {
                      button_label: 'Send reset instructions',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
