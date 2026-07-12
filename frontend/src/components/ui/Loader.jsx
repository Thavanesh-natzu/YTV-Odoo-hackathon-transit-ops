import React from 'react';
import { motion } from 'framer-motion';

/**
 * Loader.jsx
 * -----------------------------------------------------------------------
 * Pulsing HUD-style loader. Three sizes, optional label, optional
 * full-screen overlay mode for route/data loading states.
 * -----------------------------------------------------------------------
 */

const SIZE_PX = { sm: 22, md: 36, lg: 56 };

function PulseRings({ size }) {
  const px = SIZE_PX[size] || SIZE_PX.md;
  return (
    <div style={{ position: 'relative', width: px, height: px }}>
      {[0, 0.35].map((delay, i) => (
        <motion.span
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid var(--color-accent)',
          }}
          initial={{ opacity: 0.6, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: 'easeOut',
            delay,
          }}
        />
      ))}
      <span
        style={{
          position: 'absolute',
          inset: px * 0.28,
          borderRadius: '50%',
          background: 'var(--color-accent)',
          boxShadow: '0 0 12px var(--color-accent)',
          animation: 'pulseGlow 1.4s ease-in-out infinite',
        }}
      />
    </div>
  );
}

export default function Loader({ size = 'md', label, fullScreen = false }) {
  const content = (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
      }}
    >
      <PulseRings size={size} />
      {label && (
        <span
          className="mono"
          style={{
            fontSize: 'var(--fs-xs)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          {label}
        </span>
      )}
      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
        Loading
      </span>
    </div>
  );

  if (!fullScreen) return content;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(7, 11, 18, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 999,
      }}
    >
      {content}
    </div>
  );
}
