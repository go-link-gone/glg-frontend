import { Link } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';

export default function NotFoundPage() {
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

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-gutter py-margin text-center">
        <div className="text-[clamp(96px,18vw,160px)] font-extrabold leading-none tracking-tight">
          <span className="brand-shimmer">404</span>
        </div>
        <h1 className="mt-md text-headline-lg-mobile font-bold text-on-surface md:text-headline-lg">
          This link went somewhere we can't follow.
        </h1>
        <p className="mt-sm max-w-md text-body-md text-on-surface-variant">
          The page you tried to reach doesn't exist — or it might be a short
          link that was deleted. Head back home and try again.
        </p>
        <div className="mt-md flex flex-col gap-2 sm:flex-row">
          <Link to="/" className="brand-btn rounded-lg px-5 py-2.5 text-body-md font-semibold">
            Take me home
          </Link>
          <Link
            to="/links"
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-body-md font-medium text-on-surface hover:bg-surface-container"
          >
            View my links
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
