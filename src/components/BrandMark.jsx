import { Link } from 'react-router-dom';

/**
 * GoLinkGone brand lockup: logo tile + "Go[Link]Gone" wordmark.
 * The middle "Link" word carries the cyan→blue→violet brand gradient — the
 * one place (besides the logo) where the full gradient is allowed to appear.
 */
export default function BrandMark({
  to = '/',
  size = 30,
  showWordmark = true,
  className = '',
  wordmarkClass = 'text-[19px]',
}) {
  const inner = (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span
        className="relative inline-grid shrink-0 place-items-center overflow-hidden rounded-[10px] ring-1 ring-inset ring-white/10"
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
        <span
          className={`font-bold tracking-[-0.02em] text-on-surface ${wordmarkClass}`}
        >
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
