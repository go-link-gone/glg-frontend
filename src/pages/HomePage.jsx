import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { createShortLink, createQr } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';
import GridBackground from '../components/GridBackground';

const QrStudio = lazy(() => import('../components/QrStudio'));

const FEATURES = [
  ['bolt', 'Sub-second redirects', 'An in-memory key store backed by Postgres lands every click instantly.'],
  ['qr_code_2', 'Customizable QR codes', 'Design branded QR codes — colors, shapes, logo, and frames — then export as PNG or SVG.'],
  ['insights', 'Click analytics', 'Country, city, device, and deduplicated unique-visitor counts per link.'],
];

export default function HomePage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [savingQr, setSavingQr] = useState(false);
  const [qrSaved, setQrSaved] = useState(false);

  const saveQr = async (config) => {
    if (!result?.shortUrl) return;
    const shortKey = result.shortUrl.split('/').pop();
    setSavingQr(true);
    try {
      await createQr(shortKey, null, config);
      setQrSaved(true);
      pushToast({ type: 'success', title: 'QR saved', message: 'Find it under My Links → Details' });
    } catch (err) {
      pushToast({ type: 'error', title: 'Could not save QR', message: err.message });
    } finally {
      setSavingQr(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (!/^https?:\/\//i.test(url.trim())) {
      pushToast({
        type: 'error',
        title: 'Invalid URL',
        message: 'URL must start with http:// or https://',
      });
      return;
    }
    setLoading(true);
    setResult(null);
    setQrSaved(false);
    try {
      const data = await createShortLink(url.trim());
      setResult(data);
      pushToast({ type: 'success', title: 'Short link created' });
    } catch (err) {
      pushToast({ type: 'error', title: 'Could not shorten link', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyShort = async () => {
    if (!result?.shortUrl) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      pushToast({ type: 'error', title: 'Copy failed' });
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <TopNav />

      <main className="relative flex-1">
        <GridBackground />

        <div className="relative z-10 mx-auto w-full max-w-max-width px-gutter pt-xl pb-lg">
          {/* Hero */}
          <section className="mx-auto max-w-2xl text-center">
            <div className="animate-rise-up inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1 text-label-caps uppercase text-on-surface-variant shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {user ? `Signed in as ${user.email}` : 'URL shortener + click analytics'}
            </div>
            <h1 className="animate-rise-up mt-5 text-[clamp(34px,5.6vw,56px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-on-surface">
              Shorten any link.
              <br />
              Measure every click.
            </h1>
            <p className="animate-rise-up mx-auto mt-4 max-w-xl text-body-lg text-on-surface-variant">
              Paste a URL to get a fast, trackable short link with a fully customizable QR code —
              then see exactly where your traffic comes from.
            </p>
          </section>

          {/* Sign-in nudge (only when logged out) */}
          {!user && (
            <Link
              to="/auth"
              className="animate-fade-up group mx-auto mt-6 flex max-w-2xl items-center gap-3 rounded-xl border border-primary/30 bg-brand-gradient-soft px-4 py-3 shadow-soft transition-colors hover:border-primary/50"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-gradient text-white">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  insights
                </span>
              </span>
              <span className="flex-1 text-body-sm text-on-surface">
                <span className="font-semibold">Sign in to get analytics</span> — track clicks, countries,
                cities &amp; devices for every link you create.
              </span>
              <span
                className="material-symbols-outlined shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
                style={{ fontSize: 18 }}
              >
                arrow_forward
              </span>
            </Link>
          )}

          {/* Shortener */}
          <form
            onSubmit={submit}
            className="focus-ring animate-fade-up mx-auto mt-8 w-full max-w-2xl rounded-2xl border border-outline-variant bg-surface-container-lowest p-2 shadow-soft transition-shadow"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-1 items-center gap-2.5 rounded-xl px-3.5">
                <span className="material-symbols-outlined text-on-surface-variant" aria-hidden style={{ fontSize: 20 }}>
                  link
                </span>
                <input
                  type="url"
                  inputMode="url"
                  aria-label="URL to shorten"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/a-very-long-url"
                  className="h-12 w-full bg-transparent text-body-md text-on-surface outline-none placeholder:text-outline"
                  disabled={loading}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="brand-btn flex h-12 min-w-[150px] items-center justify-center gap-2 rounded-xl px-5 text-body-md"
              >
                {loading ? (
                  <Spinner size={18} color="#fff" label="Shortening…" />
                ) : (
                  <>
                    Shorten
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {result && (
            <>
            <div className="animate-scale-in mx-auto mt-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-soft">
              <div className="flex flex-col gap-4 p-5 md:p-6">
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <div className="text-label-caps uppercase text-secondary">Destination</div>
                    <div className="mt-1.5 truncate text-body-sm text-on-surface-variant" title={url}>
                      {url}
                    </div>
                  </div>
                  <div>
                    <div className="text-label-caps uppercase text-secondary">Short link</div>
                    <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-2 pl-3.5">
                      <a
                        href={result.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 truncate font-mono text-body-md font-medium text-primary hover:underline"
                      >
                        {result.shortUrl}
                      </a>
                      <button
                        type="button"
                        onClick={copyShort}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          {copied ? 'check' : 'content_copy'}
                        </span>
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  {user && (
                    <Link
                      to="/links"
                      className="inline-flex items-center gap-1 text-body-sm font-medium text-primary hover:underline"
                    >
                      View all my links
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        arrow_forward
                      </span>
                    </Link>
                  )}
                </div>

              </div>
            </div>

            <div className="animate-scale-in mx-auto mt-4 w-full max-w-2xl rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-soft md:p-6">
              <div className="mb-4">
                <h3 className="text-body-md font-semibold text-on-surface">Customize your QR code</h3>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">
                  {user
                    ? 'Style it, download, or save it to this link.'
                    : 'Style it and download — sign in to save designs.'}
                </p>
              </div>
              {qrSaved ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <span className="material-symbols-outlined text-success" style={{ fontSize: 40 }}>
                    check_circle
                  </span>
                  <p className="text-body-md text-on-surface">QR code saved to this link.</p>
                  <div className="flex gap-2">
                    <Link to="/links" className="brand-btn rounded-lg px-4 py-2.5 text-body-sm">
                      View in My Links
                    </Link>
                    <button
                      type="button"
                      onClick={() => setQrSaved(false)}
                      className="rounded-lg border border-outline-variant px-4 py-2.5 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
                    >
                      Customize another
                    </button>
                  </div>
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="grid place-items-center py-8">
                      <Spinner size={20} color="rgb(37 99 235)" label="Loading QR studio…" />
                    </div>
                  }
                >
                  <QrStudio
                    data={result.shortUrl}
                    fileName={result.shortUrl.split('/').pop()}
                    onSave={user ? saveQr : undefined}
                    saving={savingQr}
                  />
                </Suspense>
              )}
            </div>
            </>
          )}

          {/* Feature row */}
          <section className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-outline-variant bg-outline-variant sm:grid-cols-3">
            {FEATURES.map(([icon, title, body]) => (
              <div key={title} className="bg-surface-container-lowest p-5">
                <span className="material-symbols-outlined text-primary" aria-hidden style={{ fontSize: 22 }}>
                  {icon}
                </span>
                <h3 className="mt-3 text-body-md font-semibold text-on-surface">{title}</h3>
                <p className="mt-1 text-body-sm leading-relaxed text-on-surface-variant">{body}</p>
              </div>
            ))}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
