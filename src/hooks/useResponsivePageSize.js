import { useEffect, useState } from 'react';

// Page size tuned to viewport so the list always fills the screen cleanly.
export default function useResponsivePageSize() {
  const [size, setSize] = useState(() => calc());

  useEffect(() => {
    const onResize = () => setSize(calc());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}

function calc() {
  if (typeof window === 'undefined') return 20;
  const w = window.innerWidth;
  if (w < 640) return 8;   // phone
  if (w < 1024) return 14; // tablet
  if (w < 1536) return 20; // laptop
  return 30;               // large desktop
}
