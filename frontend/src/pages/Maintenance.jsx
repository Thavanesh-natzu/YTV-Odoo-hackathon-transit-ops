/**
 * Maintenance.jsx
 * Lists maintenance records, allows creating a new (Active) record, and
 * closing an Active record — mirroring the Maintenance APIs in
 * API_SPEC.md and the transitions in STATUS_TRANSITIONS.md.
 *
 * Depends on Developer 2's vehicleService.js to populate the vehicle
 * dropdown.
 */

import { useEffect, useState, useCallback } from 'react';
import maintenanceService from '../services/maintenanceService';
import vehicleService from '../services/vehicleService';

const INITIAL_FORM = {
  vehicle_id: '',
  description: '',
  cost: '',
  start_date: '',
};

function extractErrorMessage(err, fallback) {
  return err.response?.data?.errors?.join(', ') || err.response?.data?.message || fallback;
}

function Maintenance() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [recordsRes, vehiclesRes] = await Promise.all([
        maintenanceService.getAllMaintenance(),
        vehicleService.getAllVehicles(),
      ]);
      setRecords(recordsRes.data.data);
      setVehicles(vehiclesRes.data.data);
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Failed to load maintenance records.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErrors([]);
    try {
      await maintenanceService.createMaintenance(form);
      setForm(INITIAL_FORM);
      await loadData();
    } catch (err) {
      setFormErrors(err.response?.data?.errors || [err.response?.data?.message || 'Failed to create record.']);
    }
  };

  const handleClose = async (maintenanceId) => {
    setBusyId(maintenanceId);
    try {
      await maintenanceService.closeMaintenance(maintenanceId);
      await loadData();
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Failed to close maintenance record.'));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p>Loading maintenance records...</p>;

  return (
    <div className="maintenance-page">
      <h1>Maintenance</h1>
      {loadError && <p className="error-text">{loadError}</p>}

      <form onSubmit={handleCreate} className="maintenance-form">
        <h2>New Maintenance Record</h2>
        {formErrors.length > 0 && (
          <ul className="error-list">
            {formErrors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        )}
        <label>
          Vehicle
          <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required>
            <option value="">Select vehicle</option>
            {vehicles.map((v) => (
              <option key={v.vehicle_id} value={v.vehicle_id}>
                {v.vehicle_name} ({v.registration_number})
              </option>
            ))}
          </select>
        </label>
        <label>
          Description
          <input name="description" value={form.description} onChange={handleChange} required />
        </label>
        <label>
          Cost
          <input type="number" step="0.01" min="0" name="cost" value={form.cost} onChange={handleChange} />
        </label>
        <label>
          Start Date
          <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
        </label>
        <button type="submit">Create Record</button>
      </form>

      {records.length === 0 ? (
        <p className="empty-state">No maintenance records yet.</p>
      ) : (
        <table className="maintenance-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Vehicle ID</th>
              <th>Description</th>
              <th>Cost</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.maintenance_id}>
                <td>{record.maintenance_id}</td>
                <td>{record.vehicle_id}</td>
                <td>{record.description}</td>
                <td>{record.cost}</td>
                <td>{record.start_date}</td>
                <td>{record.end_date ?? '-'}</td>
                <td>{record.status}</td>
                <td>
                  {record.status === 'Active' && (
                    <button disabled={busyId === record.maintenance_id} onClick={() => handleClose(record.maintenance_id)}>
                      Close
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Maintenance;
