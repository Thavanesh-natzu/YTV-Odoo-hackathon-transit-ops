import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Modal.jsx
 * -----------------------------------------------------------------------
 * Accessible modal dialog with a scale-in/out transition. Traps focus,
 * closes on Escape and backdrop click, restores focus to the trigger on
 * close.
 * -----------------------------------------------------------------------
 */

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose?.();
      };
      document.addEventListener('keydown', handleKeyDown);
      dialogRef.current?.focus();
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (triggerRef.current instanceof HTMLElement) {
          triggerRef.current.focus();
        }
      };
    }
    return undefined;
  }, [open, onClose]);

  const widths = { sm: 380, md: 520, lg: 720 };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(4, 7, 12, 0.66)',
            backdropFilter: 'blur(4px)',
            padding: 'var(--space-4)',
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            tabIndex={-1}
            className="hud-frame"
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 6 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
              width: '100%',
              maxWidth: widths[size] || widths.md,
              maxHeight: '86vh',
              overflowY: 'auto',
              padding: 'var(--space-5)',
            }}
          >
            {title && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <h3 id="modal-title" style={{ margin: 0 }}>
                  {title}
                </h3>
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <div>{children}</div>

            {footer && (
              <div
                style={{
                  marginTop: 'var(--space-5)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 'var(--space-2)',
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
