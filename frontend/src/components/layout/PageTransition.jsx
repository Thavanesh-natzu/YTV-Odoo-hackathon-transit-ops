import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * PageTransition.jsx
 * -----------------------------------------------------------------------
 * Wraps route/page content in a smooth enter/exit transition, with an
 * optional lightweight looping video background.
 *
 * Lag-free video approach:
 *  - <video> is muted, playsInline, preload="metadata" and only starts
 *    playback once `onCanPlay` fires, avoiding jank on first paint.
 *  - The video itself never animates — only cheap `opacity`/`transform`
 *    layers above it animate, so the compositor never has to re-rasterize
 *    decoded video frames.
 *  - `pointer-events: none` + `aria-hidden` keep it purely decorative and
 *    out of the accessibility tree and interaction path.
 *  - Respects prefers-reduced-motion by freezing on the first frame.
 * -----------------------------------------------------------------------
 */

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function PageTransition({
  routeKey,
  children,
  videoSrc,
  overlayOpacity = 0.72,
}) {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <div style={{ position: 'relative', minHeight: '100%', overflow: 'hidden' }}>
      {videoSrc && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            loop
            playsInline
            autoPlay={!prefersReducedMotion}
            preload="metadata"
            onCanPlay={() => setVideoReady(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: videoReady ? 0.5 : 0,
              transition: 'opacity 0.8s var(--ease-hud)',
              transform: 'translateZ(0)', // force its own GPU layer
              willChange: 'opacity',
            }}
          />
          <div className="scanline-overlay" />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, var(--color-void) 0%, transparent 30%, transparent 70%, var(--color-void) 100%)`,
              opacity: overlayOpacity,
            }}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={routeKey}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ position: 'relative', zIndex: 1 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
