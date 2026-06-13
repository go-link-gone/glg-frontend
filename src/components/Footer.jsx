import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-outline-variant bg-surface">
      <div className="mx-auto flex max-w-max-width flex-col gap-6 px-gutter py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <BrandMark size={28} wordmarkClass="text-[17px]" />
          <span className="text-body-sm text-on-surface-variant">
            Shorter links. Smarter insights.
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-body-sm font-medium text-on-surface-variant">
          <Link to="/privacy" className="transition-colors hover:text-on-surface">
            Privacy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-on-surface">
            Terms
          </Link>
          <Link to="/docs" className="transition-colors hover:text-on-surface">
            API docs
          </Link>
          <a
            href="mailto:support@golinkgone.com"
            className="transition-colors hover:text-on-surface"
          >
            Support
          </a>
        </nav>

        <div className="text-body-sm text-secondary">
          © {new Date().getFullYear()} GoLinkGone
        </div>
      </div>
    </footer>
  );
}
