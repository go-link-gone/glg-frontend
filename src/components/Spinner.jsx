export default function Spinner({ size = 20, color = 'currentColor', label }) {
  const s = `${size}px`;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="spinner inline-block rounded-full border-2 border-transparent"
        style={{
          width: s,
          height: s,
          borderTopColor: color,
          borderRightColor: color,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
        }}
        aria-hidden="true"
      />
      {label ? <span>{label}</span> : null}
    </span>
  );
}
