import { Component } from 'react';
import BrandMark from './BrandMark';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    
    if (typeof window !== 'undefined' && window.__GLG_REPORT_ERROR__) {
      try {
        window.__GLG_REPORT_ERROR__(error, info);
      } catch {
        /* swallow */
      }
    }
    // Console log is intentional — last resort for visibility in prod.
    // eslint-disable-next-line no-console
    console.error('[GoLinkGone] Unhandled UI error', error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-gutter py-margin">
        <div className="relative z-10 w-full max-w-lg rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-elevated md:p-8">
          <div className="mb-6">
            <BrandMark to={null} size={30} />
          </div>
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-error-container text-error">
              <span className="material-symbols-outlined">bug_report</span>
            </div>
            <div className="flex-1">
              <h1 className="text-headline-md text-on-surface">
                Something just went sideways.
              </h1>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                The page hit an unexpected error. Our team has been notified.
                You can try again, or head back to the home page.
              </p>
              {import.meta.env.DEV && (
                <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-outline-variant bg-surface-container-low p-3 text-body-sm text-on-surface">
                  {error.message}
                </pre>
              )}
            </div>
          </div>
          <div className="mt-md flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <a
              href="/"
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-center text-body-md font-medium text-on-surface hover:bg-surface-container"
            >
              Go home
            </a>
            <button
              onClick={() => {
                this.reset();
                if (typeof window !== 'undefined') window.location.reload();
              }}
              className="brand-btn rounded-lg px-4 py-2 text-body-md font-semibold"
            >
              Reload the page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
