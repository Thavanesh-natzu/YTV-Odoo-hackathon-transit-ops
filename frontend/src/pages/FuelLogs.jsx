/**
 * FuelLogs.jsx
 * ---------------------------------------------------------------------------
 * Fuel Logs page (per PROJECT_STRUCTURE.md, pages/ = "Individual application
 * screens"). Lists existing fuel logs (GET /fuel) and provides a form to add
 * a new one (POST /fuel), via fuelService.js.
 *
 * Per BUSINESS_RULES.md -> "Frontend performs only basic input validation."
 * This page only checks that required fields are present and that liters/
 * cost are positive numbers before submitting; the backend is the source of
 * truth for all business-rule enforcement (e.g. vehicle existence).
 *
 * UI/UX upgrade: page transition, card-based form with gradient submit
 * button, animated validation/success/error banners, skeleton table rows
 * while loading, and staggered row entrance animations for the fuel log
 * table (Framer Motion).
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFuelLogs, addFuelLog } from "../services/fuelService";

const EMPTY_FORM = {
  vehicle_id: "",
  trip_id: "",
  liters: "",
  cost: "",
  date: "",
};

const SUCCESS_MESSAGE_TIMEOUT_MS = 3000;

function FuelLogs() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  async function loadFuelLogs() {
    setIsTableLoading(true);
    setLoadError(null);
    try {
      const logs = await getFuelLogs();
      setFuelLogs(logs);
    } catch (err) {
      setLoadError(err);
    } finally {
      setIsTableLoading(false);
    }
  }

  useEffect(() => {
    loadFuelLogs();
  }, []);

  useEffect(() => {
    if (!showSuccess) return undefined;
    const timeoutId = setTimeout(() => setShowSuccess(false), SUCCESS_MESSAGE_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [showSuccess]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validateForm() {
    const errors = [];

    if (!form.vehicle_id) errors.push("Vehicle is required.");
    if (!form.date) errors.push("Date is required.");

    if (!form.liters || Number.isNaN(Number(form.liters)) || Number(form.liters) <= 0) {
      errors.push("Liters must be a number greater than zero.");
    }

    if (!form.cost || Number.isNaN(Number(form.cost)) || Number(form.cost) <= 0) {
      errors.push("Cost must be a number greater than zero.");
    }

    // Previously missing: trip_id, when provided, was not validated at all
    // and would silently become NaN on submit if non-numeric.
    if (form.trip_id && (!Number.isInteger(Number(form.trip_id)) || Number(form.trip_id) <= 0)) {
      errors.push("Trip ID must be a whole positive number if provided.");
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      setSubmitError(null);
      return;
    }

    setFormErrors([]);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await addFuelLog({
        vehicle_id: form.vehicle_id,
        trip_id: form.trip_id || null,
        liters: form.liters,
        cost: form.cost,
        date: form.date,
      });

      setForm(EMPTY_FORM);
      setShowSuccess(true);
      await loadFuelLogs();
    } catch (err) {
      setSubmitError(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const cardStyle = {
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.07)",
    padding: "1.5rem",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.55rem 0.75rem",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "0.95rem",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#475569",
    marginBottom: "0.35rem",
  };

  return (
    <motion.div
      className="fuel-logs-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      <h1 style={{ margin: 0 }}>Fuel Logs</h1>

      <motion.form
        className="fuel-logs-page__form"
        onSubmit={handleSubmit}
        style={{
          ...cardStyle,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          alignItems: "end",
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="form-field">
          <label style={labelStyle} htmlFor="vehicle_id">Vehicle ID</label>
          <input
            id="vehicle_id"
            name="vehicle_id"
            type="number"
            style={inputStyle}
            value={form.vehicle_id}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label style={labelStyle} htmlFor="trip_id">Trip ID (optional)</label>
          <input
            id="trip_id"
            name="trip_id"
            type="number"
            style={inputStyle}
            value={form.trip_id}
            onChange={handleChange}
          />
        </div>

        <div className="form-field">
          <label style={labelStyle} htmlFor="liters">Liters</label>
          <input
            id="liters"
            name="liters"
            type="number"
            step="0.01"
            min="0.01"
            style={inputStyle}
            value={form.liters}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label style={labelStyle} htmlFor="cost">Cost</label>
          <input
            id="cost"
            name="cost"
            type="number"
            step="0.01"
            min="0.01"
            style={inputStyle}
            value={form.cost}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label style={labelStyle} htmlFor="date">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            style={inputStyle}
            value={form.date}
            onChange={handleChange}
            required
          />
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            border: "none",
            borderRadius: "10px",
            padding: "0.65rem 1.25rem",
            fontWeight: 700,
            color: "#ffffff",
            backgroundImage: "linear-gradient(120deg, #2563eb, #7c3aed)",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.75 : 1,
          }}
        >
          {isSubmitting ? "Saving..." : "Add Fuel Log"}
        </motion.button>

        <AnimatePresence>
          {formErrors.length > 0 && (
            <motion.ul
              key="form-errors"
              role="alert"
              className="fuel-logs-page__form-errors"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                gridColumn: "1 / -1",
                margin: 0,
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                listStylePosition: "inside",
              }}
            >
              {formErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </motion.ul>
          )}

          {submitError && (
            <motion.div
              key="submit-error"
              role="alert"
              className="fuel-logs-page__form-errors"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                gridColumn: "1 / -1",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
              }}
            >
              {submitError.message}
              {submitError.errors?.length > 0 && (
                <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.1rem" }}>
                  {submitError.errors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}

          {showSuccess && (
            <motion.div
              key="submit-success"
              role="status"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                gridColumn: "1 / -1",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#15803d",
                fontWeight: 600,
              }}
            >
              Fuel log added successfully.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      <section className="fuel-logs-page__list" style={cardStyle}>
        {loadError && (
          <div role="alert" style={{ color: "#b91c1c", marginBottom: "0.75rem" }}>
            Failed to load fuel logs: {loadError.message}
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: "0.6rem" }}>Fuel ID</th>
              <th style={{ padding: "0.6rem" }}>Vehicle ID</th>
              <th style={{ padding: "0.6rem" }}>Trip ID</th>
              <th style={{ padding: "0.6rem" }}>Liters</th>
              <th style={{ padding: "0.6rem" }}>Cost</th>
              <th style={{ padding: "0.6rem" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {isTableLoading ? (
              Array.from({ length: 4 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`}>
                  {Array.from({ length: 6 }).map((__, colIndex) => (
                    <td key={colIndex} style={{ padding: "0.6rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: "100%",
                          height: "1rem",
                          borderRadius: "6px",
                          background:
                            "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 37%, #e2e8f0 63%)",
                          backgroundSize: "400% 100%",
                          animation: "fuel-log-shimmer 1.4s ease infinite",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <AnimatePresence initial={false}>
                {fuelLogs.map((log, index) => (
                  <motion.tr
                    key={log.fuel_id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03 }}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td style={{ padding: "0.6rem" }}>{log.fuel_id}</td>
                    <td style={{ padding: "0.6rem" }}>{log.vehicle_id}</td>
                    <td style={{ padding: "0.6rem" }}>{log.trip_id ?? "-"}</td>
                    <td style={{ padding: "0.6rem" }}>{log.liters}</td>
                    <td style={{ padding: "0.6rem" }}>{log.cost}</td>
                    <td style={{ padding: "0.6rem" }}>{log.date}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>

        {!isTableLoading && !loadError && fuelLogs.length === 0 && (
          <p style={{ textAlign: "center", color: "#64748b", padding: "1.5rem 0" }}>
            No fuel logs yet. Add one above to get started.
          </p>
        )}
      </section>

      <style>{`
        @keyframes fuel-log-shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }
      `}</style>
    </motion.div>
  );
}

export default FuelLogs;
