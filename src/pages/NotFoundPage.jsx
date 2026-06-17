import { Link } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import GridBackground from '../components/GridBackground';

export default function NotFoundPage() {
  return (
    <div className="animate-fade-in relative flex min-h-screen flex-col bg-background">
      <header className="relative z-10 w-full border-b border-outline-variant/80 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-max-width items-center justify-between px-gutter">
          <BrandMark size={30} />
          <ThemeToggle />
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-gutter py-margin">
        <GridBackground />
        <div className="relative z-10 mx-auto max-w-xl text-center">
          <div className="text-[clamp(88px,16vw,150px)] font-extrabold leading-none tracking-[-0.04em]">
            <span className="brand-text">404</span>
          </div>
          <h1 className="mt-4 text-headline-lg-mobile text-on-surface md:text-headline-lg">
            This link went somewhere we can't follow.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-body-md text-on-surface-variant">
            The page you tried to reach doesn't exist — or it may be a short link that
            was deleted. Head back home and try again.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Link to="/" className="brand-btn rounded-lg px-5 py-2.5 text-body-md">
              Take me home
            </Link>
            <Link
              to="/links"
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-body-md font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              View my links
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
