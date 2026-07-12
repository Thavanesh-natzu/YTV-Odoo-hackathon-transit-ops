import React, { Suspense, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import StatusBadge from '../ui/StatusBadge';

/**
 * TripTimeline.jsx
 * -----------------------------------------------------------------------
 * Animated trip lifecycle per STATUS_TRANSITIONS.md:
 *
 *   Draft ─────► Dispatched ─────► Completed
 *     │               │
 *     └────► Cancelled◄┘
 *
 *   - Every new trip starts Draft.
 *   - Only Draft trips can be Dispatched.
 *   - Only Dispatched trips can be Completed.
 *   - Draft or Dispatched trips can be Cancelled.
 *   - Completed / Cancelled are final states.
 *
 * This component is read-only: it renders wherever the trip's status
 * currently sits in that graph (via the `status` prop, one of the
 * DATABASE_SCHEMA.md Trip ENUM values) and never triggers a status
 * change itself — dispatch/complete/cancel happen through the backend
 * PATCH endpoints in API_SPEC.md.
 * -----------------------------------------------------------------------
 */

const BASE_STEPS = ['Draft', 'Dispatched', 'Completed'];

function stepIndexFor(status) {
  if (status === 'Cancelled') return -1; // handled separately, branch state
  return BASE_STEPS.indexOf(status);
}

function AnimatedRouteLine({ progress, cancelled }) {
  const points = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const t = i / 39;
        return new THREE.Vector3(t * 6 - 3, Math.sin(t * Math.PI) * 0.6, 0);
      }),
    []
  );
  const lineRef = useRef();

  useFrame((_, delta) => {
    if (!lineRef.current) return;
    // Gently pulse the dash offset to suggest motion along the route
    lineRef.current.material.dashOffset -= delta * (cancelled ? 0 : 0.6);
  });

  const visibleCount = Math.max(2, Math.round(points.length * progress));

  return (
    <>
      <ambientLight intensity={0.9} />
      <Line
        ref={lineRef}
        points={points.slice(0, visibleCount)}
        color={cancelled ? '#FF5470' : '#00E5FF'}
        lineWidth={2}
        dashed
        dashSize={0.15}
        gapSize={0.08}
        transparent
        opacity={0.85}
      />
      <Line points={points} color="#1C2636" lineWidth={1} transparent opacity={0.5} />
    </>
  );
}

export default function TripTimeline({ status = 'Draft', timestamps = {}, trip }) {
  const cancelled = status === 'Cancelled';
  // When cancelled, whether it happened from Draft or after Dispatch
  // determines how far along the stepper to mark as "reached".
  const currentIndex = cancelled ? (timestamps.Dispatched ? 1 : 0) : stepIndexFor(status);
  const progress = (currentIndex + 1) / BASE_STEPS.length;

  return (
    <div className="hud-frame" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h4 style={{ margin: 0 }}>Trip Lifecycle{trip?.trip_id ? ` — #${trip.trip_id}` : ''}</h4>
        <StatusBadge status={status} domain="Trip" />
      </div>

      <div style={{ height: 90 }} aria-hidden="true">
        <Suspense fallback={null}>
          <Canvas
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
            camera={{ position: [0, 0, 4.2], fov: 40 }}
          >
            <AnimatedRouteLine progress={progress} cancelled={cancelled} />
          </Canvas>
        </Suspense>
      </div>

      <ol
        style={{
          listStyle: 'none',
          display: 'flex',
          margin: 'var(--space-3) 0 0',
          padding: 0,
          position: 'relative',
        }}
      >
        {BASE_STEPS.map((step, index) => {
          const reached = index <= currentIndex;
          const isCurrent = !cancelled && index === currentIndex;

          return (
            <li key={step} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
              {index > 0 && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 11,
                    left: '-50%',
                    width: '100%',
                    height: 2,
                    background: reached ? 'var(--color-accent)' : 'var(--color-panel-border)',
                    zIndex: 0,
                  }}
                />
              )}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.12, type: 'spring', stiffness: 320, damping: 22 }}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: 22,
                  height: 22,
                  margin: '0 auto',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: reached ? 'var(--color-accent)' : 'var(--color-panel)',
                  border: `2px solid ${reached ? 'var(--color-accent)' : 'var(--color-panel-border)'}`,
                  boxShadow: isCurrent ? '0 0 0 6px rgba(0, 229, 255, 0.15)' : 'none',
                }}
              >
                {reached && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#04141A' }} />
                )}
              </motion.div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 'var(--fs-xs)',
                  color: reached ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                }}
              >
                {step}
              </div>
            </li>
          );
        })}
      </ol>

      {cancelled && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 84, 112, 0.08)',
            border: '1px solid rgba(255, 84, 112, 0.3)',
            fontSize: 'var(--fs-sm)',
            color: 'var(--color-danger)',
          }}
        >
          This trip was cancelled{timestamps.Dispatched ? ' after dispatch' : ' while in draft'}.
        </motion.div>
      )}
    </div>
  );
}
