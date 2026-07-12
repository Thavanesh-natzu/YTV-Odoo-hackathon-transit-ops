import React from 'react';
import { motion } from 'framer-motion';

/**
 * Button.jsx
 * -----------------------------------------------------------------------
 * Reusable action button with a lightweight "depth hover" effect.
 *
 * Note on the 3D requirement: a full react-three-fiber <Canvas> per
 * button is unnecessary GPU/memory overhead for a simple UI control (a
 * WebGL context per button does not stay "lightweight, non-blocking" at
 * scale on a dashboard with dozens of buttons). Instead this reaches the
 * same visual goal — a tactile sense of depth on hover — with a
 * transform-only CSS 3D tilt + elevated shadow, animated by Framer
 * Motion. Purely transform/opacity based, so it stays on the GPU
 * compositor and never triggers layout.
 * -----------------------------------------------------------------------
 */

const VARIANT_STYLES = {
  primary: {
    background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dim))',
    color: '#04141A',
    border: '1px solid transparent',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-panel-border)',
  },
  danger: {
    background: 'rgba(255, 84, 112, 0.14)',
    color: 'var(--color-danger)',
    border: '1px solid rgba(255, 84, 112, 0.4)',
  },
};

const SIZE_STYLES = {
  sm: { padding: '6px 14px', fontSize: 'var(--fs-sm)' },
  md: { padding: '10px 20px', fontSize: 'var(--fs-base)' },
  lg: { padding: '13px 26px', fontSize: 'var(--fs-lg)' },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  fullWidth = false,
  ...rest
}) {
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
      whileHover={disabled || loading ? undefined : { y: -3, rotateX: 6, scale: 1.015 }}
      whileTap={disabled || loading ? undefined : { y: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      style={{
        ...variantStyle,
        ...sizeStyle,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: fullWidth ? '100%' : 'auto',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        letterSpacing: '0.01em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transformStyle: 'preserve-3d',
        perspective: 400,
        boxShadow: variant === 'primary' ? '0 6px 18px rgba(0, 229, 255, 0.18)' : 'none',
      }}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            animation: 'sweep 0.7s linear infinite',
          }}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span aria-hidden="true">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span aria-hidden="true">{icon}</span>}
        </>
      )}
    </motion.button>
  );
}
