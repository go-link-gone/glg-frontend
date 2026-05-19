import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createShortLink } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';

function qrSrc(qrBase64) {
  if (!qrBase64) return null;
  return `data:image/png;base64,${qrBase64}`;
}

export default function HomePage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

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

  const downloadQr = () => {
    if (!result?.qrCode) return;
    const a = document.createElement('a');
    a.href = qrSrc(result.qrCode);
    const shortKey = (result.shortUrl || 'qr').split('/').pop();
    a.download = `${shortKey || 'qr'}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <TopNav />

      {/* Ambient gradient blobs */}
      <div
        aria-hidden
        className="brand-blob animate-float-slow"
        style={{
          width: 520,
          height: 520,
          left: -160,
          top: 40,
          background: 'radial-gradient(circle, rgb(var(--c-brand-cyan) / 0.55), transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="brand-blob animate-float-slower"
        style={{
          width: 560,
          height: 560,
          right: -180,
          top: 220,
          background: 'radial-gradient(circle, rgb(var(--c-brand-purple) / 0.42), transparent 60%)',
        }}
      />

      <main className="relative z-10 mx-auto flex w-full max-w-max-width flex-1 flex-col items-center px-gutter py-xl">
        {/* Decorative grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgb(var(--c-grid-line)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-grid-line)) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage:
              'radial-gradient(ellipse at center top, black 30%, transparent 70%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center top, black 30%, transparent 70%)',
          }}
        />

        <section className="relative w-full max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container-lowest/80 px-3 py-1 text-label-caps uppercase tracking-wider text-secondary shadow-soft backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {user ? `Signed in as ${user.email}` : 'Ready when you are'}
          </div>
          <h1 className="mt-md text-[clamp(40px,6vw,64px)] font-extrabold leading-[1.02] tracking-tight text-on-surface">
            Shorter links.<br />
            <span className="brand-shimmer">Smarter insights.</span>
          </h1>
          <p className="mx-auto mt-sm max-w-2xl text-body-lg text-on-surface-variant">
            Paste a URL and ship a clean short link with a built-in QR code in
            under a second. Then watch the clicks roll in — country, city,
            device, all of it.
          </p>
        </section>

        <form
          onSubmit={submit}
          className="brand-border brand-ring relative mt-lg w-full max-w-3xl rounded-2xl bg-surface-container-lowest/85 p-2 shadow-elevated backdrop-blur-xl"
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center rounded-xl bg-surface-container-low px-4">
              <span className="material-symbols-outlined text-secondary" aria-hidden>
                link
              </span>
              <input
                type="url"
                inputMode="url"
                aria-label="URL to shorten"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-long-url.example.com/path?with=parameters"
                className="ml-2 h-14 w-full bg-transparent text-body-lg text-on-surface outline-none placeholder:text-outline"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="brand-btn flex h-14 min-w-[170px] items-center justify-center gap-2 rounded-xl px-6 text-body-md font-semibold"
            >
              {loading ? (
                <Spinner size={18} color="#fff" label="Generating…" />
              ) : (
                <>
                  Generate
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        {result && (
          <div className="brand-border mt-md w-full max-w-3xl rounded-2xl bg-surface-container-lowest/90 p-md shadow-elevated backdrop-blur-xl">
            <div className="flex flex-col gap-md md:flex-row md:items-stretch md:gap-md">
              <div className="flex-1 space-y-md">
                <div>
                  <div className="text-label-caps uppercase text-secondary">Original URL</div>
                  <div
                    className="mt-1 truncate text-body-md text-on-surface"
                    title={url}
                  >
                    {url}
                  </div>
                </div>
                <div>
                  <div className="text-label-caps uppercase text-secondary">Short URL</div>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-3">
                    <a
                      href={result.shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 truncate text-body-lg font-semibold brand-text hover:underline"
                    >
                      {result.shortUrl}
                    </a>
                    <button
                      type="button"
                      onClick={copyShort}
                      className="flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {copied ? 'check' : 'content_copy'}
                      </span>
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    to="/links"
                    className="inline-flex items-center gap-1 text-body-sm font-semibold brand-text hover:underline"
                  >
                    View all my links
                    <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 16 }}>
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 border-outline-variant pt-md md:border-l md:pl-md md:pt-0">
                <div className="brand-border flex h-44 w-44 items-center justify-center rounded-2xl bg-white p-3 shadow-glow-sm">
                  {result.qrCode ? (
                    <img
                      src={qrSrc(result.qrCode)}
                      alt="QR code"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-body-sm text-secondary">No QR</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={downloadQr}
                  disabled={!result.qrCode}
                  className="inline-flex items-center gap-1 text-body-sm font-semibold brand-text hover:underline disabled:text-secondary disabled:no-underline"
                >
                  <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 16 }}>
                    download
                  </span>
                  Download QR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feature row */}
        <section className="mt-xl grid w-full max-w-max-width grid-cols-1 gap-md md:grid-cols-3">
          {[
            ['bolt', 'Sub-second redirects', 'Backed by an in-memory key store and Postgres so every click lands instantly.'],
            ['qr_code_2', 'Instant QR codes', 'Every short link ships with a print-ready QR — download with one click.'],
            ['monitoring', 'Real analytics', 'Country, city, device, and deduped unique-visitor counts per link.'],
          ].map(([icon, title, body]) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest/85 p-md shadow-soft backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-glow"
            >
              {/* gradient sheen on hover */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(circle at top right, rgb(var(--c-brand-cyan) / 0.18), transparent 55%), radial-gradient(circle at bottom left, rgb(var(--c-brand-purple) / 0.15), transparent 50%)',
                }}
              />
              <div className="relative">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow-sm">
                  <span className="material-symbols-outlined">{icon}</span>
                </div>
                <h3 className="mt-3 text-body-lg font-semibold text-on-surface">{title}</h3>
                <p className="mt-1 text-body-sm text-on-surface-variant">{body}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
