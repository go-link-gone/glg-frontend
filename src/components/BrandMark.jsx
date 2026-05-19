import { Link } from 'react-router-dom';

/**
 * GoLinkGone brand lockup: square logo tile + "Go[Link]Gone" wordmark.
 * The middle "Link" word uses the cyan→blue→purple brand gradient (matches the banner).
 */
export default function BrandMark({
  to = '/',
  size = 36,
  showWordmark = true,
  className = '',
  wordmarkClass = 'text-headline-md',
}) {
  const inner = (
    <span className={`flex items-center gap-3 ${className}`}>
      <span
        className="relative inline-grid place-items-center overflow-hidden rounded-xl shadow-glow-sm ring-1 ring-brand-blue/30"
        style={{ width: size, height: size, background: '#0a1428' }}
      >
        <img
          src="/GLG_Logo.png"
          alt="GoLinkGone"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </span>
      {showWordmark && (
        <span className={`font-extrabold tracking-tight text-on-surface ${wordmarkClass}`}>
          Go<span className="brand-text">Link</span>Gone
        </span>
      )}
    </span>
  );

  if (!to) return inner;
  return (
    <Link to={to} className="inline-flex items-center" aria-label="GoLinkGone home">
      {inner}
    </Link>
  );
}
