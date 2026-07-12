import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * IntroAnimation.jsx
 * -----------------------------------------------------------------------
 * One-time premium intro sequence shown on app boot: a looping HUD video
 * backdrop with a staged Framer Motion reveal of the TransitOps
 * wordmark and tagline, then hands off to the app.
 *
 * Lag-free notes:
 *  - Video decodes on its own compositor layer (`transform: translateZ(0)`),
 *    is muted/playsInline so mobile browsers allow autoplay, and only
 *    fades in once `onCanPlay` fires — no play() calls before the browser
 *    says it's ready, which is what causes stutter on slow connections.
 *  - The whole sequence is time-boxed (`durationMs`) and skippable, so it
 *    never blocks the demo if the video is slow to buffer.
 *  - Skips straight to onComplete if prefers-reduced-motion is set.
 * -----------------------------------------------------------------------
 */

export default function IntroAnimation({ videoSrc, onComplete, durationMs = 3200, skippable = true }) {
  const [visible, setVisible] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const timeoutRef = useRef(null);
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const finish = () => {
    setVisible(false);
    onComplete?.();
  };

  useEffect(() => {
    if (prefersReducedMotion) {
      finish();
      return undefined;
    }
    timeoutRef.current = setTimeout(finish, durationMs);
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMs, prefersReducedMotion]);

  const handleSkip = () => {
    clearTimeout(timeoutRef.current);
    finish();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="TransitOps intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            overflow: 'hidden',
            background: 'var(--color-void)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {videoSrc && (
            <video
              src={videoSrc}
              muted
              playsInline
              autoPlay
              preload="auto"
              onCanPlay={() => setVideoReady(true)}
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: videoReady ? 0.55 : 0,
                transform: 'translateZ(0)',
                transition: 'opacity 1s var(--ease-hud)',
              }}
            />
          )}
          <div className="scanline-overlay" aria-hidden="true" />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at center, transparent 0%, var(--color-void) 78%)',
            }}
          />

          <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-xs)',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                marginBottom: 'var(--space-3)',
              }}
            >
              Fleet Command Online
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
                margin: 0,
                letterSpacing: '0.04em',
              }}
            >
              TransitOps
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.6 }}
              style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-muted)' }}
            >
              Smart Transport Operations Platform
            </motion.p>

            {skippable && (
              <motion.button
                type="button"
                onClick={handleSkip}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.4 }}
                style={{
                  marginTop: 'var(--space-6)',
                  background: 'transparent',
                  border: '1px solid var(--color-panel-border)',
                  color: 'var(--color-text-muted)',
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--fs-xs)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Skip
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
