import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import BrandMark from '../components/BrandMark';
import Spinner from '../components/Spinner';

const MODE_SIGN_IN = 'sign_in';
const MODE_SIGN_UP = 'sign_up';
const MODE_VERIFY_OTP = 'verify_otp';
const MODE_FORGOT = 'forgot';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#EA4335"
        d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"
      />
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#FBBC05"
        d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z"
      />
    </svg>
  );
}

export default function AuthPage() {
  const redirectTo = `${window.location.origin}/`;

  const [mode, setMode] = useState(MODE_SIGN_IN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [resendIn, setResendIn] = useState(0);

  const otpInputRef = useRef(null);
  useEffect(() => {
    if (mode === MODE_VERIFY_OTP) {
      setTimeout(() => otpInputRef.current?.focus(), 50);
    }
  }, [mode]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const clearStatus = () => {
    setError(null);
    setInfo(null);
  };

  const switchMode = (next) => {
    clearStatus();
    setMode(next);
    if (next !== MODE_VERIFY_OTP) setOtp('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    clearStatus();
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    clearStatus();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.session) {
      // Email confirmation disabled — already signed in.
      return;
    }
    setOtp('');
    setMode(MODE_VERIFY_OTP);
    setInfo(`We sent a 6-digit code to ${email}. Enter it below to finish creating your account.`);
    setResendIn(30);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearStatus();
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    // On success, AuthContext picks up the new session and redirects.
  };

  const handleResendOtp = async () => {
    if (resendIn > 0) return;
    clearStatus();
    setLoading(true);
    const { error: err } = await supabase.auth.resend({ type: 'signup', email });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo(`A new code was sent to ${email}.`);
    setResendIn(30);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    clearStatus();
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo(`Password reset instructions sent to ${email}.`);
  };

  const handleGoogle = async () => {
    clearStatus();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (err) setError(err.message);
  };

  const cardHeading =
    mode === MODE_SIGN_UP
      ? 'Create your account'
      : mode === MODE_VERIFY_OTP
      ? 'Verify your email'
      : mode === MODE_FORGOT
      ? 'Reset your password'
      : 'Welcome back';

  const cardSub =
    mode === MODE_SIGN_UP
      ? 'Start shortening links and tracking clicks in seconds.'
      : mode === MODE_VERIFY_OTP
      ? 'Enter the 6-digit code we just emailed you.'
      : mode === MODE_FORGOT
      ? "We'll email you a link to set a new password."
      : 'Sign in to manage your links and view analytics.';

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
        {/* Decorative grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgb(var(--c-grid-line)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-grid-line)) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
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
          <div className="brand-border rounded-2xl bg-surface-container-lowest/85 p-lg shadow-elevated backdrop-blur-xl md:p-margin">
            <h2 className="text-headline-md font-bold text-on-surface">{cardHeading}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">{cardSub}</p>

            {/* Tabs (hidden on OTP + forgot screens) */}
            {(mode === MODE_SIGN_IN || mode === MODE_SIGN_UP) && (
              <div
                role="tablist"
                aria-label="Authentication mode"
                className="mt-md grid grid-cols-2 gap-1 rounded-xl border border-outline-variant bg-surface-container-low p-1"
              >
                {[
                  [MODE_SIGN_IN, 'Sign in'],
                  [MODE_SIGN_UP, 'Sign up'],
                ].map(([key, label]) => {
                  const active = mode === key;
                  return (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={active}
                      type="button"
                      onClick={() => switchMode(key)}
                      className={`h-9 rounded-lg text-body-sm font-semibold transition-all ${
                        active
                          ? 'bg-brand-gradient text-white shadow-glow-sm'
                          : 'text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Status banner */}
            {(error || info) && (
              <div
                role={error ? 'alert' : 'status'}
                className={`mt-md flex items-start gap-2 rounded-lg border px-3 py-2 text-body-sm ${
                  error
                    ? 'border-error/30 bg-error-container text-on-error-container'
                    : 'border-outline-variant bg-surface-container-low text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined mt-0.5" style={{ fontSize: 18 }}>
                  {error ? 'error' : 'mark_email_read'}
                </span>
                <span className="flex-1">{error || info}</span>
              </div>
            )}

            {/* Forms */}
            <div className="mt-md">
              {mode === MODE_SIGN_IN && (
                <form onSubmit={handleSignIn} className="space-y-3">
                  <Field
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={setEmail}
                    required
                  />
                  <Field
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={setPassword}
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode(MODE_FORGOT)}
                      className="text-body-sm font-medium brand-text hover:underline"
                    >
                      Forgot your password?
                    </button>
                  </div>
                  <PrimaryButton loading={loading}>Sign in</PrimaryButton>
                </form>
              )}

              {mode === MODE_SIGN_UP && (
                <form onSubmit={handleSignUp} className="space-y-3">
                  <Field
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={setEmail}
                    required
                  />
                  <Field
                    label="Create a password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={setPassword}
                    required
                    hint="At least 6 characters."
                  />
                  <PrimaryButton loading={loading}>Create account</PrimaryButton>
                </form>
              )}

              {mode === MODE_VERIFY_OTP && (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div>
                    <label
                      htmlFor="otp"
                      className="text-body-sm font-medium text-on-surface-variant"
                    >
                      6-digit code
                    </label>
                    <input
                      id="otp"
                      ref={otpInputRef}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      placeholder="••••••"
                      className="mt-1 block h-14 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-center font-mono text-[28px] font-semibold tracking-[0.5em] text-on-surface outline-none transition-colors placeholder:text-outline focus:border-brand-blue"
                      required
                    />
                    <p className="mt-1 text-body-sm text-on-surface-variant">
                      Sent to <span className="font-medium text-on-surface">{email}</span>.
                    </p>
                  </div>
                  <PrimaryButton loading={loading}>Verify email</PrimaryButton>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => switchMode(MODE_SIGN_UP)}
                      className="inline-flex items-center gap-1 text-body-sm font-medium text-on-surface-variant hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        arrow_back
                      </span>
                      Use a different email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendIn > 0 || loading}
                      className="text-body-sm font-semibold brand-text hover:underline disabled:text-secondary disabled:no-underline"
                    >
                      {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                    </button>
                  </div>
                </form>
              )}

              {mode === MODE_FORGOT && (
                <form onSubmit={handleForgot} className="space-y-3">
                  <Field
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={setEmail}
                    required
                  />
                  <PrimaryButton loading={loading}>Send reset instructions</PrimaryButton>
                  <button
                    type="button"
                    onClick={() => switchMode(MODE_SIGN_IN)}
                    className="inline-flex items-center gap-1 text-body-sm font-medium text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      arrow_back
                    </span>
                    Back to sign in
                  </button>
                </form>
              )}
            </div>

            {/* OAuth (hidden during OTP step) */}
            {mode !== MODE_VERIFY_OTP && (
              <>
                <div className="mt-md flex items-center gap-3">
                  <div className="h-px flex-1 bg-outline-variant" />
                  <span className="text-label-caps uppercase tracking-wider text-secondary">
                    or
                  </span>
                  <div className="h-px flex-1 bg-outline-variant" />
                </div>
                <button
                  type="button"
                  onClick={handleGoogle}
                  className="mt-md flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md font-medium text-on-surface transition-colors hover:bg-surface-container"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Field({ label, type, value, onChange, autoComplete, required, hint }) {
  return (
    <label className="block">
      <span className="text-body-sm font-medium text-on-surface-variant">{label}</span>
      <input
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 block h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:border-brand-blue"
      />
      {hint && <p className="mt-1 text-body-sm text-on-surface-variant">{hint}</p>}
    </label>
  );
}

function PrimaryButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="brand-btn flex h-11 w-full items-center justify-center gap-2 rounded-lg text-body-md font-semibold disabled:opacity-70"
    >
      {loading ? <Spinner size={18} color="#fff" /> : children}
    </button>
  );
}
