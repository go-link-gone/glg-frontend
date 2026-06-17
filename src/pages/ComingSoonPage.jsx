import { Link, useLocation } from 'react-router-dom';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import BrandMark from '../components/BrandMark';
import ThemeToggle from '../components/ThemeToggle';
import GridBackground from '../components/GridBackground';
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
    <div className="animate-fade-in relative flex min-h-screen flex-col bg-background">
      {session ? (
        <TopNav />
      ) : (
        <header className="relative z-10 w-full border-b border-outline-variant/80 bg-surface/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-max-width items-center justify-between px-gutter">
            <BrandMark size={30} />
            <ThemeToggle />
          </div>
        </header>
      )}

      <main className="relative flex flex-1 items-center justify-center px-gutter py-margin">
        <GridBackground />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1 text-label-caps uppercase text-on-surface-variant shadow-soft">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              schedule
            </span>
            Coming soon
          </div>
          <h1 className="mt-5 text-headline-lg-mobile text-on-surface md:text-headline-lg">
            {meta.title}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-body-md text-on-surface-variant">{meta.body}</p>
          <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Link to="/" className="brand-btn rounded-lg px-5 py-2.5 text-body-md">
              Back to home
            </Link>
            <a
              href="mailto:support@golinkgone.com"
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-body-md font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              Email support
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
