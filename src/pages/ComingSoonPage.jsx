import { Link, useLocation } from 'react-router-dom';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

const COPY = {
  '/privacy': {
    title: 'Privacy Policy',
    body: "We're finalizing the wording with our counsel. In short: GoLinkGone stores the URLs you shorten, click metadata (country, city, device class, timestamp), and your account email. We don't sell your data.",
  },
  '/terms': {
    title: 'Terms of Service',
    body: 'Our terms are being prepared. Until they go live, the short version is: use GoLinkGone for lawful links only, your data is yours, and account deletion wipes everything.',
  },
  '/docs': {
    title: 'API Docs',
    body: "Public API documentation is on the way. If you'd like early access for an integration, reach out to support and tell us what you're building.",
  },
};

export default function ComingSoonPage() {
  const { pathname } = useLocation();
  const { session } = useAuth();
  const meta = COPY[pathname] ?? {
    title: 'Coming soon',
    body: 'This page is being built. Check back shortly.',
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {session ? <TopNav /> : null}
      <div
        aria-hidden
        className="brand-blob animate-float-slow"
        style={{
          width: 480,
          height: 480,
          left: -120,
          top: 60,
          background: 'radial-gradient(circle, rgb(var(--c-brand-cyan) / 0.5), transparent 60%)',
        }}
      />
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-gutter py-margin text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container-lowest/80 px-3 py-1 text-label-caps uppercase tracking-wider text-secondary shadow-soft backdrop-blur">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            schedule
          </span>
          Coming soon
        </div>
        <h1 className="mt-md text-headline-lg-mobile font-bold text-on-surface md:text-headline-lg">
          <span className="brand-text">{meta.title}</span>
        </h1>
        <p className="mt-sm max-w-md text-body-md text-on-surface-variant">{meta.body}</p>
        <div className="mt-md flex flex-col gap-2 sm:flex-row">
          <Link to="/" className="brand-btn rounded-lg px-5 py-2.5 text-body-md font-semibold">
            Back to home
          </Link>
          <a
            href="mailto:support@golinkgone.com"
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-body-md font-medium text-on-surface hover:bg-surface-container"
          >
            Email support
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
