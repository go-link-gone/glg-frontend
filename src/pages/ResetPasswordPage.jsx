import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import BrandMark from '../components/BrandMark';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasSession(!!data.session);
    });
    return () => {
      active = false;
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (pwd.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (pwd !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password: pwd });
    if (err) {
      setSubmitting(false);
      setError(err.message);
      return;
    }
    await supabase.auth.signOut();
    pushToast({
      type: 'success',
      title: 'Password updated',
      message: 'Sign in with your new password.',
    });
    navigate('/auth', { replace: true });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="brand-blob animate-float-slow"
        style={{
          width: 520,
          height: 520,
          left: -160,
          top: -80,
          background: 'radial-gradient(circle, rgb(var(--c-brand-cyan) / 0.5), transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="brand-blob animate-float-slower"
        style={{
          width: 560,
          height: 560,
          right: -200,
          bottom: -120,
          background: 'radial-gradient(circle, rgb(var(--c-brand-purple) / 0.45), transparent 60%)',
        }}
      />

      <header className="relative z-10 w-full border-b border-outline-variant/60 bg-surface-container-lowest/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-max-width items-center justify-between px-gutter">
          <BrandMark size={44} />
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-gutter py-margin">
        <div className="brand-border rounded-2xl bg-surface-container-lowest/85 p-lg shadow-elevated backdrop-blur-xl md:p-margin">
          <h1 className="text-headline-md font-bold text-on-surface">Set a new password</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Choose a new password for your account. You'll be signed back in after.
          </p>

          {hasSession === false && (
            <div
              role="alert"
              className="mt-md flex items-start gap-2 rounded-lg border border-error/30 bg-error-container px-3 py-2 text-body-sm text-on-error-container"
            >
              <span className="material-symbols-outlined mt-0.5" style={{ fontSize: 18 }}>
                error
              </span>
              <span className="flex-1">
                This reset link has expired or is invalid. Request a fresh link from the
                sign-in page.
              </span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-md flex items-start gap-2 rounded-lg border border-error/30 bg-error-container px-3 py-2 text-body-sm text-on-error-container"
            >
              <span className="material-symbols-outlined mt-0.5" style={{ fontSize: 18 }}>
                error
              </span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="mt-md space-y-3">
            <label className="block">
              <span className="text-body-sm font-medium text-on-surface-variant">New password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
                disabled={hasSession === false}
                className="mt-1 block h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:border-brand-blue disabled:opacity-50"
                placeholder="••••••••"
              />
              <p className="mt-1 text-body-sm text-on-surface-variant">At least 8 characters.</p>
            </label>
            <label className="block">
              <span className="text-body-sm font-medium text-on-surface-variant">
                Confirm password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={hasSession === false}
                className="mt-1 block h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:border-brand-blue disabled:opacity-50"
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit"
              disabled={submitting || hasSession === false}
              className="brand-btn flex h-11 w-full items-center justify-center gap-2 rounded-lg text-body-md font-semibold disabled:opacity-70"
            >
              {submitting ? <Spinner size={18} color="#fff" /> : 'Update password'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/auth', { replace: true })}
              className="inline-flex items-center gap-1 text-body-sm font-medium text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_back
              </span>
              Back to sign in
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}