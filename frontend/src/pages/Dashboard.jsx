/**
 * Dashboard.jsx
 * ---------------------------------------------------------------------------
 * Operational Dashboard page (per PROJECT_STRUCTURE.md, pages/ = "Individual
 * application screens"). Composes:
 *   - useDashboardMetrics (hooks/) for KPI data (GET /dashboard)
 *   - KPICards (components/) to render the KPIs from BUSINESS_RULES.md
 *   - FleetUtilizationChart + FuelCostTrendChart (components/Charts.jsx)
 *   - fuelService (services/) to fetch recent fuel logs for the trend chart
 *
 * This page performs no business logic — it only fetches data via the
 * approved service/hook layer and renders it, per API_SPEC.md -> "Business
 * validations are performed in the backend only."
 *
 * UI/UX upgrade: page-level fade/slide transition, gradient header banner,
 * staggered section reveal, animated error banners, and a background-aware
 * refresh indicator (using the hook's isRefreshing flag) so refreshing data
 * doesn't re-trigger the full loading skeleton.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useDashboardMetrics from "../hooks/useDashboardMetrics";
import KPICards from "../components/KPICards";
import { FleetUtilizationChart, FuelCostTrendChart } from "../components/Charts";
import { getFuelLogs } from "../services/fuelService";

const REFRESH_INTERVAL_MS = 30000;

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut", delay },
  }),
};

function Dashboard() {
  const { metrics, isLoading, isRefreshing, error, refresh } = useDashboardMetrics({
    pollIntervalMs: REFRESH_INTERVAL_MS,
  });

  const [fuelLogs, setFuelLogs] = useState([]);
  const [isFuelLogsLoading, setIsFuelLogsLoading] = useState(true);
  const [fuelLogsError, setFuelLogsError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFuelLogs() {
      setIsFuelLogsLoading(true);
      try {
        const logs = await getFuelLogs();
        if (!isMounted) return;
        setFuelLogs(logs);
        setFuelLogsError(null);
      } catch (err) {
        if (isMounted) setFuelLogsError(err);
      } finally {
        if (isMounted) setIsFuelLogsLoading(false);
      }
    }

    loadFuelLogs();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <motion.div
      className="dashboard-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      <motion.header
        className="dashboard-page__header"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.5rem 2rem",
          borderRadius: "20px",
          backgroundImage: "linear-gradient(120deg, #1d4ed8, #7c3aed)",
          color: "#ffffff",
          boxShadow: "0 10px 30px rgba(29, 78, 216, 0.25)",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
            Operational Dashboard
          </h1>
          <p style={{ margin: "0.25rem 0 0", opacity: 0.85, fontSize: "0.9rem" }}>
            Live fleet KPIs, utilization, and fuel trends
          </p>
        </div>

        <motion.button
          type="button"
          onClick={refresh}
          disabled={isLoading || isRefreshing}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          style={{
            border: "1px solid rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.12)",
            color: "#ffffff",
            borderRadius: "999px",
            padding: "0.55rem 1.1rem",
            fontWeight: 600,
            cursor: isLoading || isRefreshing ? "not-allowed" : "pointer",
          }}
        >
          {isRefreshing ? "Refreshing..." : isLoading ? "Loading..." : "Refresh"}
        </motion.button>
      </motion.header>

      <AnimatePresence>
        {error && (
          <motion.div
            key="dashboard-error"
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              borderRadius: "12px",
              padding: "0.75rem 1rem",
            }}
          >
            Failed to load dashboard metrics: {error.message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={0.1}>
        <KPICards metrics={metrics} isLoading={isLoading} />
      </motion.section>

      <motion.section
        className="dashboard-page__charts"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={0.2}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.25rem",
        }}
      >
        <FleetUtilizationChart fleetUtilization={metrics?.fleetUtilization} />

        <AnimatePresence mode="wait">
          {fuelLogsError ? (
            <motion.div
              key="fuel-logs-error"
              role="alert"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: "12px",
                padding: "0.75rem 1rem",
              }}
            >
              Failed to load fuel logs: {fuelLogsError.message}
            </motion.div>
          ) : (
            <FuelCostTrendChart key="fuel-cost-chart" fuelLogs={isFuelLogsLoading ? [] : fuelLogs} />
          )}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}

export default Dashboard;
