/**
 * KPICards.jsx
 * ---------------------------------------------------------------------------
 * Reusable UI component that renders the fleet KPI cards for the Dashboard,
 * per BUSINESS_RULES.md -> Dashboard KPIs:
 *   - Active Vehicles
 *   - Available Vehicles
 *   - Vehicles In Shop
 *   - Active Trips
 *   - Pending Trips
 *   - Drivers On Duty
 *   - Fleet Utilization (%)
 *
 * This component is presentation-only: it receives the `metrics` object
 * (as returned by GET /dashboard, via useDashboardMetrics) and renders it.
 * It performs no calculations of its own, per API_SPEC.md -> "Business
 * validations are performed in the backend only."
 *
 * UI/UX upgrade: staggered fade-in on mount, animated count-up per KPI
 * (Framer Motion), hover-lift on each card, gradient accent bars, soft
 * shadows, and a shimmering skeleton state while loading.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { motion, animate, AnimatePresence } from "framer-motion";

const KPI_DEFINITIONS = [
  { key: "activeVehicles", label: "Active Vehicles", accent: "from-sky-400 to-blue-500" },
  { key: "availableVehicles", label: "Available Vehicles", accent: "from-emerald-400 to-green-500" },
  { key: "vehiclesInShop", label: "Vehicles In Shop", accent: "from-amber-400 to-orange-500" },
  { key: "activeTrips", label: "Active Trips", accent: "from-indigo-400 to-violet-500" },
  { key: "pendingTrips", label: "Pending Trips", accent: "from-slate-400 to-slate-500" },
  { key: "driversOnDuty", label: "Drivers On Duty", accent: "from-teal-400 to-cyan-500" },
  { key: "fleetUtilization", label: "Fleet Utilization", suffix: "%", accent: "from-fuchsia-400 to-pink-500" },
];

const cardContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

/**
 * Renders a single numeric value that smoothly tweens from its previous
 * value to its next value whenever it changes, instead of an abrupt swap.
 */
function AnimatedCount({ value, suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(value ?? 0);
  const previousValueRef = useRef(value ?? 0);

  useEffect(() => {
    const from = previousValueRef.current;
    const to = value ?? 0;

    const controls = animate(from, to, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.round(latest * 10) / 10),
    });

    previousValueRef.current = to;
    return () => controls.stop();
  }, [value]);

  return (
    <span>
      {displayValue}
      {suffix}
    </span>
  );
}

AnimatedCount.propTypes = {
  value: PropTypes.number,
  suffix: PropTypes.string,
};

/** Simple color read for the Fleet Utilization KPI: low/mid/high bands. */
function utilizationTone(value) {
  if (value >= 75) return "#16a34a"; // green - high utilization
  if (value >= 40) return "#d97706"; // amber - moderate
  return "#dc2626"; // red - low utilization
}

function KPICards({ metrics, isLoading }) {
  return (
    <motion.div
      className="kpi-cards-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1rem",
      }}
      variants={cardContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {KPI_DEFINITIONS.map(({ key, label, suffix, accent }) => {
          const isUtilization = key === "fleetUtilization";
          const value = metrics?.[key] ?? 0;

          return (
            <motion.div
              className="kpi-card"
              key={key}
              variants={cardVariants}
              whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)" }}
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "16px",
                padding: "1.25rem 1.25rem 1rem",
                background: "#ffffff",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  backgroundImage: `linear-gradient(90deg, var(--kpi-accent-start, #38bdf8), var(--kpi-accent-end, #2563eb))`,
                }}
                className={`kpi-card__accent bg-gradient-to-r ${accent}`}
              />

              <span
                className="kpi-card__label"
                style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", letterSpacing: "0.02em" }}
              >
                {label}
              </span>

              <span
                className="kpi-card__value"
                style={{
                  fontSize: "1.85rem",
                  fontWeight: 700,
                  color: isUtilization ? utilizationTone(value) : "#0f172a",
                  lineHeight: 1.1,
                }}
              >
                {isLoading || !metrics ? (
                  <span
                    className="kpi-card__skeleton"
                    aria-hidden="true"
                    style={{
                      display: "inline-block",
                      width: "3.5rem",
                      height: "1.6rem",
                      borderRadius: "6px",
                      background:
                        "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 37%, #e2e8f0 63%)",
                      backgroundSize: "400% 100%",
                      animation: "kpi-shimmer 1.4s ease infinite",
                    }}
                  />
                ) : (
                  <AnimatedCount value={value} suffix={suffix || ""} />
                )}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <style>{`
        @keyframes kpi-shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }
      `}</style>
    </motion.div>
  );
}

KPICards.propTypes = {
  metrics: PropTypes.shape({
    activeVehicles: PropTypes.number,
    availableVehicles: PropTypes.number,
    vehiclesInShop: PropTypes.number,
    activeTrips: PropTypes.number,
    pendingTrips: PropTypes.number,
    driversOnDuty: PropTypes.number,
    fleetUtilization: PropTypes.number,
  }),
  isLoading: PropTypes.bool,
};

KPICards.defaultProps = {
  metrics: null,
  isLoading: false,
};

export default KPICards;
