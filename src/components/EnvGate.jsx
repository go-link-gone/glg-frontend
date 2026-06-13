/**
 * Fail-fast screen for misconfigured deploys.
 * If a required VITE_ env var is missing, the rest of the app would boot and
 * then quietly error on the first auth/API call. That's the worst UX in prod
 * because the failure looks like a backend outage. Instead, show a clear
 * "config missing" screen up front.
 */
const REQUIRED = [
  ['VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL],
  ['VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY],
  ['VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL],
];

export default function EnvGate({ children }) {
  const missing = REQUIRED.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length === 0) return children;

  return (
    <div className="grid min-h-screen place-items-center bg-background px-gutter py-margin">
      <div className="w-full max-w-lg rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-elevated md:p-8">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-error-container text-error">
            <span className="material-symbols-outlined">build_circle</span>
          </div>
          <div className="flex-1">
            <h1 className="text-headline-md text-on-surface">
              GoLinkGone isn't configured.
            </h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              The following environment variable{missing.length === 1 ? ' is' : 's are'} missing.
              Set {missing.length === 1 ? 'it' : 'them'} in your deployment (or
              <code className="mx-1 rounded bg-surface-container px-1 py-0.5 text-xs">.env</code>
              for local dev) and reload.
            </p>
            <ul className="mt-3 space-y-1 rounded-lg border border-outline-variant bg-surface-container-low p-3 font-mono text-body-sm text-on-surface">
              {missing.map((k) => (
                <li key={k}>• {k}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
