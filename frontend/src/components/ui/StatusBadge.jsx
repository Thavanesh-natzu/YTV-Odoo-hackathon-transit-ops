import React from 'react';
import { motion } from 'framer-motion';

/**
 * StatusBadge.jsx
 * -----------------------------------------------------------------------
 * Renders the exact ENUM status values defined in DATABASE_SCHEMA.md.
 * This component is purely presentational: it never mutates status —
 * per API_SPEC.md / STATUS_TRANSITIONS.md, status changes only happen
 * through the dedicated backend trip/maintenance endpoints.
 *
 *   Vehicle:     Available | On Trip | In Shop | Retired
 *   Driver:      Available | On Trip | Off Duty | Suspended
 *   Trip:        Draft | Dispatched | Completed | Cancelled
 *   Maintenance: Active | Completed
 * -----------------------------------------------------------------------
 */

const STATUS_COLOR = {
  // Positive / operational-normal
  Available: 'var(--color-success)',
  Completed: 'var(--color-success)',

  // In-progress
  'On Trip': 'var(--color-info)',
  Dispatched: 'var(--color-info)',
  Active: 'var(--color-info)',

  // Neutral / pre-operational
  Draft: 'var(--color-text-muted)',
  'Off Duty': 'var(--color-text-muted)',

  // Attention
  'In Shop': 'var(--color-accent-amber)',

  // Stopped / final-negative
  Retired: 'var(--color-danger)',
  Suspended: 'var(--color-danger)',
  Cancelled: 'var(--color-danger)',
};

const PULSING_STATUSES = new Set(['On Trip', 'Dispatched', 'Active']);

export default function StatusBadge({ status, domain }) {
  const color = STATUS_COLOR[status] || 'var(--color-text-muted)';
  const shouldPulse = PULSING_STATUSES.has(status);

  return (
    <span
      className="mono"
      title={domain ? `${domain} status: ${status}` : status}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 'var(--fs-xs)',
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
      }}
    >
      <motion.span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}`,
          display: 'inline-block',
        }}
        animate={shouldPulse ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
        transition={shouldPulse ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
      {status}
    </span>
  );
}
