import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, children, labelledBy, widthClass = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        className={`animate-scale-in my-auto w-full ${widthClass} rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-elevated`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
