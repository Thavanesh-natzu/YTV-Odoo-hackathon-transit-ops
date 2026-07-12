// frontend/src/pages/Login.jsx
//
// Login screen. Calls useAuth().login(), which in turn calls
// authService.login() -> POST /auth/login (API_SPEC.md).
//
// Per API_SPEC.md API Rules: "Frontend must never modify status values
// directly" - this component only submits credentials and displays
// whatever the backend returns; it performs no business logic itself.
//
// ============================================================================
// UI/UX UPGRADE (this pass adds no new files, no new routes, no new backend
// calls - only presentation, animation, and 3D flourishes around the exact
// same auth flow as before):
//
//   - Video background (GPU-accelerated, muted/autoplay/loop/playsInline)
//     with a dark overlay and a CSS-gradient fallback if the video asset
//     is missing or autoplay is blocked by the browser.
//   - Lightweight React-Three-Fiber scene behind the card: one rotating
//     icosahedron + a ~300-point particle field. Both animate via useFrame
//     mutating refs directly - they NEVER call setState, so the 3D scene
//     cannot trigger a React re-render of the form.
//   - 3D tilt-on-hover for the login card via Framer Motion motion values
//     (GPU transform only - rotateX/rotateY/perspective, no layout changes).
//   - Framer Motion micro-animations: card fade/slide-in, input focus
//     scale, button hover-lift, animated error toast.
//   - Glassmorphism styling via a single scoped <style> block (styles/ is
//     not one of Developer 1's assigned files, so no new file is added).
//   - Respects prefers-reduced-motion: the 3D canvas and heavier transitions
//     are skipped entirely for users who've asked for reduced motion.
// ============================================================================

import { useState, useCallback, useMemo, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAuth } from '../hooks/useAuth';

// ----------------------------------------------------------------------------
// Reduced-motion / capability detection
// ----------------------------------------------------------------------------

function usePrefersReducedMotion() {
  return useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
}

// ----------------------------------------------------------------------------
// Video background
// ----------------------------------------------------------------------------

function VideoBackground() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    // Fallback: pure CSS gradient, still GPU-cheap, no lag.
    return <div className="login-bg login-bg--fallback" aria-hidden="true" />;
  }

  return (
    <div className="login-bg" aria-hidden="true">
      <video
        className="login-bg__video"
        src="/assets/branding/login-bg.mp4"
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        onError={() => setFailed(true)}
      />
      <div className="login-bg__overlay" />
    </div>
  );
}

// ----------------------------------------------------------------------------
// 3D scene: floating shape + particle field
// (kept intentionally lightweight - low poly count, low particle count,
// no postprocessing, no shadows, capped pixel ratio)
// ----------------------------------------------------------------------------

function FloatingShape() {
  const meshRef = useRef(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    // Mutate the mesh directly - no setState, no re-render.
    meshRef.current.rotation.x = t * 0.15;
    meshRef.current.rotation.y = t * 0.22;
    meshRef.current.position.y = Math.sin(t * 0.6) * 0.25;
  });

  return (
    <mesh ref={meshRef} position={[1.4, 0, -2]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#7f77dd"
        emissive="#3c3489"
        emissiveIntensity={0.6}
        wireframe
      />
    </mesh>
  );
}

function ParticleField() {
  const pointsRef = useRef(null);
  const PARTICLE_COUNT = 260;

  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#9fe1cb"
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function SceneBackground() {
  return (
    <div className="login-scene" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: true }}
        camera={{ position: [0, 0, 4], fov: 50 }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 3]} intensity={1.2} color="#a9a2ff" />
        <Suspense fallback={null}>
          <FloatingShape />
          <ParticleField />
        </Suspense>
      </Canvas>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Error toast
// ----------------------------------------------------------------------------

function ErrorToast({ message, onDismiss }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="login-toast"
          role="alert"
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={onDismiss}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ----------------------------------------------------------------------------
// Login page
// ----------------------------------------------------------------------------

export default function Login() {
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = usePrefersReducedMotion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState(null);

  // --- 3D tilt-on-hover (GPU transform only, no layout impact) -------------
  const cardTiltX = useMotionValue(0);
  const cardTiltY = useMotionValue(0);
  const rotateX = useTransform(cardTiltY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(cardTiltX, [-0.5, 0.5], [-8, 8]);

  const handleCardMouseMove = useCallback(
    (e) => {
      if (prefersReducedMotion) return;
      const bounds = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - bounds.left) / bounds.width - 0.5;
      const y = (e.clientY - bounds.top) / bounds.height - 0.5;
      cardTiltX.set(x);
      cardTiltY.set(y);
    },
    [cardTiltX, cardTiltY, prefersReducedMotion]
  );

  const handleCardMouseLeave = useCallback(() => {
    cardTiltX.set(0);
    cardTiltY.set(0);
  }, [cardTiltX, cardTiltY]);

  const activeError = formError || error;

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (loading) return; // guard against double-submit

      setFormError(null);
      clearError();

      const trimmedEmail = email.trim();

      if (!trimmedEmail || !password) {
        setFormError('Please enter both email and password.');
        return;
      }

      try {
        await login(trimmedEmail, password);
        navigate('/dashboard');
      } catch {
        // useAuth already captures `error` from the API response and
        // ErrorToast renders it - nothing further to do here.
      }
    },
    [email, password, loading, login, navigate, clearError]
  );

  return (
    <div className="login-page">
      <VideoBackground />
      {!prefersReducedMotion && <SceneBackground />}

      <motion.form
        className="login-card"
        onSubmit={handleSubmit}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={
          prefersReducedMotion
            ? undefined
            : { rotateX, rotateY, transformPerspective: 900 }
        }
      >
        <h1 className="login-title">TransitOps</h1>
        <p className="login-subtitle">Sign in to manage your fleet operations</p>

        <label className="login-label" htmlFor="email">
          Email
        </label>
        <motion.input
          id="email"
          className="login-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          whileFocus={{ scale: 1.015 }}
          transition={{ duration: 0.15 }}
          required
        />

        <label className="login-label" htmlFor="password">
          Password
        </label>
        <motion.input
          id="password"
          className="login-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          whileFocus={{ scale: 1.015 }}
          transition={{ duration: 0.15 }}
          required
        />

        <ErrorToast message={activeError} onDismiss={() => { setFormError(null); clearError(); }} />

        <motion.button
          type="submit"
          className="login-button"
          disabled={loading}
          whileHover={loading ? undefined : { y: -2, boxShadow: '0 12px 24px rgba(83, 74, 183, 0.35)' }}
          whileTap={loading ? undefined : { y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </motion.button>
      </motion.form>

      <style>{`
        .login-page {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .login-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          transform: translateZ(0); /* GPU compositing layer */
        }

        .login-bg--fallback {
          background: linear-gradient(135deg, #26215c 0%, #3c3489 50%, #04342c 100%);
        }

        .login-bg__video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          will-change: transform;
        }

        .login-bg__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(10, 8, 30, 0.55) 0%, rgba(10, 8, 30, 0.75) 100%);
        }

        .login-scene {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none; /* never intercepts clicks meant for the form */
        }

        .login-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 380px;
          margin: 24px;
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
          will-change: transform;
        }

        .login-title {
          margin: 0 0 4px;
          font-size: 26px;
          font-weight: 500;
          color: #ffffff;
          background: linear-gradient(90deg, #9fe1cb, #7f77dd);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-subtitle {
          margin: 0 0 20px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        .login-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.75);
          margin-top: 10px;
          margin-bottom: 6px;
        }

        .login-input {
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
          font-size: 15px;
          outline: none;
          transition: border-color 0.15s ease, background 0.15s ease;
        }

        .login-input:focus {
          border-color: #7f77dd;
          background: rgba(255, 255, 255, 0.1);
        }

        .login-toast {
          margin-top: 14px;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(226, 75, 74, 0.15);
          border: 1px solid rgba(226, 75, 74, 0.4);
          color: #f7c1c1;
          font-size: 13px;
          cursor: pointer;
        }

        .login-button {
          margin-top: 22px;
          padding: 13px 16px;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          color: #ffffff;
          background: linear-gradient(90deg, #534ab7, #0f6e56);
          cursor: pointer;
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (prefers-reduced-motion: reduce) {
          .login-card { will-change: auto; }
        }
      `}</style>
    </div>
  );
}
