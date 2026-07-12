/**
 * useDashboardMetrics.js
 * ---------------------------------------------------------------------------
 * Custom React hook that fetches and exposes fleet-wide dashboard KPIs
 * (per BUSINESS_RULES.md -> Dashboard KPIs) via GET /dashboard.
 *
 * Per PROJECT_STRUCTURE.md, hooks/ contains "Custom React hooks, Shared
 * frontend logic." This hook performs no business logic of its own — it
 * only fetches, caches in component state, and exposes the KPI values
 * exactly as returned by the backend (API_SPEC.md -> Frontend must never
 * compute or override backend-derived values).
 *
 * `isLoading` (first fetch, no data yet) and `isRefreshing` (a later fetch
 * while data already exists) are tracked separately so the UI can show a
 * full skeleton only on first load, and a subtle inline indicator on
 * background refreshes — avoiding a jarring full re-skeleton every poll.
 * ---------------------------------------------------------------------------
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getDashboardMetrics } from "../services/fuelService";

/**
 * @param {Object} [options]
 * @param {number} [options.pollIntervalMs] - Optional auto-refresh interval in ms.
 * @returns {{
 *   metrics: {
 *     activeVehicles: number,
 *     availableVehicles: number,
 *     vehiclesInShop: number,
 *     activeTrips: number,
 *     pendingTrips: number,
 *     driversOnDuty: number,
 *     fleetUtilization: number
 *   } | null,
 *   isLoading: boolean,
 *   isRefreshing: boolean,
 *   error: Error | null,
 *   refresh: () => Promise<void>
 * }}
 */
export function useDashboardMetrics({ pollIntervalMs } = {}) {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const hasLoadedOnceRef = useRef(false);

  /** Guards a state setter so it's a no-op after unmount. */
  const setIfMounted = useCallback((setter, value) => {
    if (isMountedRef.current) setter(value);
  }, []);

  const fetchMetrics = useCallback(async () => {
    const isFirstLoad = !hasLoadedOnceRef.current;

    setIfMounted(isFirstLoad ? setIsLoading : setIsRefreshing, true);
    setIfMounted(setError, null);

    try {
      const data = await getDashboardMetrics();
      setIfMounted(setMetrics, data);
      hasLoadedOnceRef.current = true;
    } catch (err) {
      setIfMounted(setError, err);
    } finally {
      setIfMounted(setIsLoading, false);
      setIfMounted(setIsRefreshing, false);
    }
  }, [setIfMounted]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchMetrics();

    let intervalId;
    if (pollIntervalMs) {
      intervalId = setInterval(fetchMetrics, pollIntervalMs);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchMetrics, pollIntervalMs]);

  return {
    metrics,
    isLoading,
    isRefreshing,
    error,
    refresh: fetchMetrics,
  };
}

export default useDashboardMetrics;
