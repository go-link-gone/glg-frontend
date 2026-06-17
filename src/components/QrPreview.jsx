import { useEffect, useRef } from 'react';
import { createQrInstance } from '../lib/qr';

// SVG ids are page-global; the library derives them from the config, so two QRs
// on one page can share ids and cross-reference each other's gradients/clip-paths.
// Suffix every id (and its references) with a per-instance token to keep them separate.
const uniquifyIds = (svg, uid) =>
  svg
    .replace(/id="([^"]+)"/g, `id="$1-${uid}"`)
    .replace(/url\(#([^)]+)\)/g, `url(#$1-${uid})`)
    .replace(/href="#([^"]+)"/g, `href="#$1-${uid}"`);

export default function QrPreview({ config, data, className, onReady }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !data) return;
    let cancelled = false;
    const uid = Math.random().toString(36).slice(2, 9);
    const qr = createQrInstance(config, data);
    onReady?.(qr);

    qr.serialize()
      .then((svg) => {
        if (cancelled || !svg) return;
        container.innerHTML = uniquifyIds(svg, uid);
        const el = container.querySelector('svg');
        if (el) {
          el.style.width = '100%';
          el.style.height = '100%';
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [config, data, onReady]);

  return <div ref={containerRef} className={className} />;
}
