import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-outline-variant bg-surface-container-low">
      <div className="mx-auto flex max-w-max-width flex-col gap-6 px-gutter py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <BrandMark size={44} />
          <span className="text-label-caps uppercase tracking-[0.18em] text-secondary">
            Shorter links. Smarter insights.
          </span>
        </div>
        <div className="text-body-sm text-secondary">
          © {new Date().getFullYear()} GoLinkGone. All rights reserved.
        </div>
        <nav className="flex flex-wrap gap-4 text-body-sm text-secondary">
          <Link to="/privacy" className="transition-colors hover:text-on-surface">
            Privacy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-on-surface">
            Terms
          </Link>
          <Link to="/docs" className="transition-colors hover:text-on-surface">
            API Docs
          </Link>
          <a
            href="mailto:support@golinkgone.com"
            className="transition-colors hover:text-on-surface"
          >
            Support
          </a>
        </nav>
      </div>
    </footer>
  );
}
