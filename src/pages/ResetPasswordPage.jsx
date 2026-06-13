import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import BrandMark from '../components/BrandMark';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';
import GridBackground from '../components/GridBackground';

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
    if (pwd.length < 6) {
      setError('Password must be at least 6 characters.');
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

  const inputClass =
    'mt-1.5 block h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary/70 focus:ring-2 focus:ring-primary/15 disabled:opacity-50';

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="relative z-10 w-full border-b border-outline-variant/80 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-max-width items-center justify-between px-gutter">
          <BrandMark size={30} />
          <ThemeToggle />
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-gutter py-margin">
        <GridBackground />
        <div className="relative z-10 w-full max-w-md">
          <div className="animate-scale-in rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-elevated md:p-8">
            <h1 className="text-headline-md text-on-surface">Set a new password</h1>
            <p className="mt-1.5 text-body-sm text-on-surface-variant">
              Choose a new password for your account. You'll be signed back in after.
            </p>

            {hasSession === false && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-2.5 rounded-lg border border-error/30 bg-error-container px-3 py-2.5 text-body-sm text-on-error-container"
              >
                <span className="material-symbols-outlined mt-0.5 shrink-0" style={{ fontSize: 18 }}>
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
                className="mt-6 flex items-start gap-2.5 rounded-lg border border-error/30 bg-error-container px-3 py-2.5 text-body-sm text-on-error-container"
              >
                <span className="material-symbols-outlined mt-0.5 shrink-0" style={{ fontSize: 18 }}>
                  error
                </span>
                <span className="flex-1">{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-label-caps uppercase text-secondary">New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  required
                  disabled={hasSession === false}
                  className={inputClass}
                  placeholder="••••••••"
                />
                <p className="mt-1.5 text-body-sm text-on-surface-variant">At least 6 characters.</p>
              </label>
              <label className="block">
                <span className="text-label-caps uppercase text-secondary">Confirm password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  disabled={hasSession === false}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </label>
              <button
                type="submit"
                disabled={submitting || hasSession === false}
                className="brand-btn flex h-11 w-full items-center justify-center gap-2 rounded-lg text-body-md"
              >
                {submitting ? <Spinner size={18} color="#fff" /> : 'Update password'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/auth', { replace: true })}
                className="inline-flex items-center gap-1 text-body-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  arrow_back
                </span>
                Back to sign in
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
