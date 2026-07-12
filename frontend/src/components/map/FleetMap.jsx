import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { ZoomIn, ZoomOut, Locate } from 'lucide-react';

/**
 * FleetMap.jsx
 * -----------------------------------------------------------------------
 * Visualizes vehicle positions with animated markers, route lines,
 * zoom/pan and status-based color coding, per DATABASE_SCHEMA.md vehicle
 * status ENUM (Available | On Trip | In Shop | Retired).
 *
 * Data contract: consumes vehicles via the `vehicles` prop (each vehicle
 * shaped like the Vehicles table: vehicle_id, vehicle_name, status, plus
 * a `position: {x, y}` in 0–100 percent map-space and optional
 * `route: [{x,y}, ...]` for the animated route line). Fetching from
 * GET /vehicles (API_SPEC.md) is the responsibility of the page/service
 * layer, not this component — FleetMap stays presentational.
 *
 * 3D layer: a single low-poly react-three-fiber <Canvas> renders a
 * handful of ambient floating shapes behind the 2D marker layer. This
 * stays lightweight and non-blocking: capped device pixel ratio,
 * `frameloop="demand"`-friendly geometry count (<= 6 meshes), no
 * postprocessing, and it never intercepts pointer events so map
 * panning/zooming remains snappy.
 * -----------------------------------------------------------------------
 */

const STATUS_MARKER_COLOR = {
  Available: '#34D399',
  'On Trip': '#7C9CFF',
  'In Shop': '#FFB020',
  Retired: '#FF5470',
};

function FloatingShapes() {
  const shapes = useMemo(
    () => [
      { pos: [-3, 1.4, -2], color: '#00E5FF', geo: 'icosahedron' },
      { pos: [3, -1, -3], color: '#7C9CFF', geo: 'octahedron' },
      { pos: [0, 2, -4], color: '#FFB020', geo: 'tetrahedron' },
    ],
    []
  );

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[5, 5, 5]} intensity={0.6} />
      {shapes.map((s, i) => (
        <Float key={i} speed={1.2} rotationIntensity={0.6} floatIntensity={1.1}>
          <mesh position={s.pos}>
            {s.geo === 'icosahedron' && <icosahedronGeometry args={[0.6, 0]} />}
            {s.geo === 'octahedron' && <octahedronGeometry args={[0.55, 0]} />}
            {s.geo === 'tetrahedron' && <tetrahedronGeometry args={[0.6, 0]} />}
            <meshStandardMaterial color={s.color} wireframe opacity={0.35} transparent />
          </mesh>
        </Float>
      ))}
    </>
  );
}

export default function FleetMap({ vehicles = [], onSelectVehicle }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef(null);

  const clampZoom = useCallback((z) => Math.min(2.4, Math.max(0.6, z)), []);

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      setZoom((z) => clampZoom(z + (e.deltaY > 0 ? -0.1 : 0.1)));
    },
    [clampZoom]
  );

  const handlePointerDown = (e) => {
    dragState.current = { startX: e.clientX, startY: e.clientY, origin: pan };
  };
  const handlePointerMove = (e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPan({ x: dragState.current.origin.x + dx, y: dragState.current.origin.y + dy });
  };
  const handlePointerUp = () => {
    dragState.current = null;
  };

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  const legendEntries = Object.entries(STATUS_MARKER_COLOR);

  return (
    <div className="fleet-map hud-frame">
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Suspense fallback={null}>
          <Canvas
            dpr={[1, 1.5]}
            frameloop="always"
            gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
            camera={{ position: [0, 0, 6], fov: 45 }}
          >
            <FloatingShapes />
          </Canvas>
        </Suspense>
      </div>

      <div
        className="fleet-map__canvas"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          cursor: dragState.current ? 'grabbing' : 'grab',
        }}
      >
        <svg
          aria-hidden="true"
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: 0 }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {vehicles
            .filter((v) => v.route?.length > 1)
            .map((v) => (
              <motion.polyline
                key={`route-${v.vehicle_id}`}
                className="fleet-map__route-line"
                points={v.route.map((p) => `${p.x},${p.y}`).join(' ')}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
        </svg>

        {vehicles.map((v) => {
          const color = STATUS_MARKER_COLOR[v.status] || '#7C8DA6';
          if (!v.position) return null;
          return (
            <motion.button
              key={v.vehicle_id}
              type="button"
              className="fleet-map__marker"
              onClick={() => onSelectVehicle?.(v)}
              style={{ left: `${v.position.x}%`, top: `${v.position.y}%`, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.25 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              aria-label={`${v.vehicle_name}, status ${v.status}`}
            >
              <span
                className="fleet-map__marker-dot"
                style={{ background: color, boxShadow: `0 0 0 4px color-mix(in srgb, ${color} 20%, transparent)` }}
              />
            </motion.button>
          );
        })}
      </div>

      <div className="fleet-map__controls">
        <button type="button" className="fleet-map__control-btn" onClick={() => setZoom((z) => clampZoom(z + 0.2))} aria-label="Zoom in">
          <ZoomIn size={16} />
        </button>
        <button type="button" className="fleet-map__control-btn" onClick={() => setZoom((z) => clampZoom(z - 0.2))} aria-label="Zoom out">
          <ZoomOut size={16} />
        </button>
        <button
          type="button"
          className="fleet-map__control-btn"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          aria-label="Reset view"
        >
          <Locate size={16} />
        </button>
      </div>

      <div className="fleet-map__legend hud-frame">
        {legendEntries.map(([status, color]) => (
          <span className="fleet-map__legend-item" key={status}>
            <span className="fleet-map__legend-dot" style={{ background: color }} />
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}

export { STATUS_MARKER_COLOR };
