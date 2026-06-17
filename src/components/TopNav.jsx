import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { deleteAccount as apiDeleteAccount } from '../lib/api';
import Modal from './Modal';
import Spinner from './Spinner';
import ThemeToggle from './ThemeToggle';
import BrandMark from './BrandMark';

function initials(user) {
  const name = user?.user_metadata?.full_name || user?.email || '';
  const parts = name.split(/[ @.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? 'U').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

export default function TopNav() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    setLogoutOpen(false);
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await apiDeleteAccount();
      await supabase.auth.signOut();
      pushToast({ type: 'success', title: 'Account deleted', message: 'Sorry to see you go.' });
      navigate('/auth', { replace: true });
    } catch (err) {
      pushToast({ type: 'error', title: 'Could not delete account', message: err.message });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const linkClass = ({ isActive }) =>
    'relative flex h-16 items-center text-body-sm transition-colors ' +
    (isActive
      ? "font-semibold text-on-surface after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-primary after:content-['']"
      : 'font-medium text-on-surface-variant hover:text-on-surface');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-outline-variant/80 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-max-width items-center justify-between px-gutter">
        <div className="flex items-center gap-3 md:gap-8">
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:text-on-surface md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={navOpen}
          >
            <span
              className="material-symbols-outlined transition-transform duration-200"
              style={{ transform: navOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              {navOpen ? 'close' : 'menu'}
            </span>
          </button>
          <BrandMark size={30} />
          <nav className="hidden items-center gap-7 md:flex">
            <NavLink to="/" end className={linkClass}>Shorten</NavLink>
            {user && <NavLink to="/links" className={linkClass}>My Links</NavLink>}
          </nav>
        </div>

        <div className="relative flex items-center gap-2.5" ref={menuRef}>
          <ThemeToggle />
          {user ? (
            <>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest py-1 pl-1 pr-2.5 text-body-sm text-on-surface transition-colors hover:border-outline"
                aria-haspopup="menu"
                aria-expanded={open}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-[12px] font-semibold text-white">
                  {initials(user)}
                </span>
                <span className="hidden max-w-[160px] truncate font-medium md:inline">
                  {user.email}
                </span>
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>
                  expand_more
                </span>
              </button>

              {open && (
                <div
                  role="menu"
                  className="animate-scale-in absolute right-0 top-12 w-64 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-elevated"
                >
                  <div className="border-b border-outline-variant px-4 py-3">
                    <div className="text-label-caps uppercase text-secondary">Signed in as</div>
                    <div className="mt-0.5 truncate text-body-sm font-medium text-on-surface">{user.email}</div>
                  </div>
                  {hasPasswordIdentity(user) ? (
                    <button
                      role="menuitem"
                      onClick={() => {
                        setOpen(false);
                        setChangePwOpen(true);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-sm text-on-surface transition-colors hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>
                        lock_reset
                      </span>
                      Change password
                    </button>
                  ) : (
                    <div className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        verified_user
                      </span>
                      Signed in with Google
                    </div>
                  )}
                  <button
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      setLogoutOpen(true);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-sm text-on-surface transition-colors hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>
                      logout
                    </span>
                    Log out
                  </button>
                  <div className="border-t border-outline-variant" />
                  <button
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      setDeleteOpen(true);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-sm text-error transition-colors hover:bg-error-container/50"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      delete_forever
                    </span>
                    Delete account
                  </button>
                </div>
              )}
            </>
          ) : (
            <NavLink
              to="/auth"
              className="brand-btn flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-body-sm"
            >
              Sign in
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                arrow_forward
              </span>
            </NavLink>
          )}
        </div>
      </div>

      {navOpen && (
        <nav className="animate-fade-in border-t border-outline-variant bg-surface-container-lowest md:hidden">
          <div className="mx-auto flex max-w-max-width flex-col px-gutter py-2">
            <NavLink
              to="/"
              end
              onClick={() => setNavOpen(false)}
              className="rounded-lg px-2 py-3 text-body-md font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              Shorten
            </NavLink>
            {user && (
              <NavLink
                to="/links"
                onClick={() => setNavOpen(false)}
                className="rounded-lg px-2 py-3 text-body-md font-medium text-on-surface transition-colors hover:bg-surface-container"
              >
                My Links
              </NavLink>
            )}
          </div>
        </nav>
      )}

      <ChangePasswordModal
        open={changePwOpen}
        onClose={() => setChangePwOpen(false)}
        user={user}
      />

      <Modal open={logoutOpen} onClose={() => setLogoutOpen(false)} labelledBy="logout-title">
        <div className="p-md">
          <div className="mb-md flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-container text-on-surface-variant">
              <span className="material-symbols-outlined" aria-hidden>logout</span>
            </div>
            <div className="flex-1">
              <h3 id="logout-title" className="text-headline-md text-on-surface">
                Log out of GoLinkGone?
              </h3>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                You'll need to sign in again to manage your links.
              </p>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setLogoutOpen(false)}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-body-md font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="brand-btn flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-body-md"
            >
              Log out
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} labelledBy="delete-acct-title">
        <div className="p-md">
          <div className="mb-md flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-error-container text-error">
              <span className="material-symbols-outlined" aria-hidden>priority_high</span>
            </div>
            <div className="flex-1">
              <h3 id="delete-acct-title" className="text-headline-md text-on-surface">
                Delete your account?
              </h3>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                All your links and analytics will be lost. This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-body-md font-medium text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="flex items-center justify-center gap-2 rounded-lg bg-error px-4 py-2 text-body-md font-semibold text-on-error transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              {deleting ? <Spinner size={16} color="#fff" label="Deleting…" /> : 'Yes, delete my account'}
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
}

function hasPasswordIdentity(user) {
  const ids = user?.identities;
  if (!Array.isArray(ids)) return false;
  return ids.some((i) => i.provider === 'email');
}

function ChangePasswordModal({ open, onClose, user }) {
  const { pushToast } = useToast();
  const [currentPwd, setCurrentPwd] = useState('');
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const userEmail = user?.email;

  const reset = () => {
    setCurrentPwd('');
    setPwd('');
    setConfirm('');
  };
  const close = () => {
    if (submitting || sendingReset) return;
    reset();
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (pwd.length < 6) {
      pushToast({ type: 'error', title: 'Password too short', message: 'Use at least 6 characters.' });
      return;
    }
    if (pwd !== confirm) {
      pushToast({ type: 'error', title: 'Passwords do not match' });
      return;
    }
    setSubmitting(true);
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPwd,
    });
    if (verifyError) {
      setSubmitting(false);
      pushToast({ type: 'error', title: 'Current password is incorrect' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSubmitting(false);
    if (error) {
      pushToast({ type: 'error', title: 'Could not update password', message: error.message });
      return;
    }
    pushToast({ type: 'success', title: 'Password updated' });
    reset();
    onClose();
  };

  const sendReset = async () => {
    if (!userEmail) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) {
      pushToast({ type: 'error', title: 'Reset email failed', message: error.message });
      return;
    }
    pushToast({
      type: 'success',
      title: 'Email sent',
      message: `Check ${userEmail} for the password reset link.`,
    });
  };

  const inputClass =
    'mt-1.5 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary/70 focus:ring-2 focus:ring-primary/15';

  return (
    <Modal open={open} onClose={close} labelledBy="change-pw-title">
      <form onSubmit={submit} className="p-md">
        <div className="mb-md flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-container text-primary">
            <span className="material-symbols-outlined">lock_reset</span>
          </div>
          <div className="flex-1">
            <h3 id="change-pw-title" className="text-headline-md text-on-surface">
              Change password
            </h3>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Enter your current password and choose a new one. Forgot it? Email yourself a reset link.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <label className="block">
            <div className="text-label-caps uppercase text-secondary">Current password</div>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </label>
          <label className="block">
            <div className="text-label-caps uppercase text-secondary">New password</div>
            <input
              type="password"
              autoComplete="new-password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </label>
          <label className="block">
            <div className="text-label-caps uppercase text-secondary">Confirm new password</div>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </label>
        </div>
        <div className="mt-md flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={sendingReset || !userEmail}
            onClick={sendReset}
            className="text-body-sm font-medium text-primary transition-opacity hover:underline disabled:opacity-50"
          >
            {sendingReset ? 'Sending…' : 'Email me a reset link instead'}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={close}
              disabled={submitting}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-body-md font-medium text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !currentPwd || !pwd || !confirm}
              className="brand-btn flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-body-md"
            >
              {submitting ? <Spinner size={16} color="#fff" label="Updating…" /> : 'Update password'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
