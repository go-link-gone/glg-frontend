/**
 * Quiet page backdrop: a soft accent wash at the top plus a faint, heavily
 * masked dot field. No floating blobs, no glow — just enough texture to give
 * the canvas depth without drawing attention to itself.
 */
export default function GridBackground({ wash = true }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {wash && (
        <div
          className="absolute inset-x-0 top-0 h-[460px]"
          style={{
            background:
              'radial-gradient(58% 100% at 50% 0%, rgb(var(--c-primary) / 0.07), transparent 72%)',
          }}
        />
      )}
      <div
        className="dot-field absolute inset-0 opacity-50 dark:opacity-70"
        style={{
          maskImage:
            'radial-gradient(ellipse 80% 52% at 50% -4%, #000 18%, transparent 76%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 52% at 50% -4%, #000 18%, transparent 76%)',
        }}
      />
    </div>
  );
}
