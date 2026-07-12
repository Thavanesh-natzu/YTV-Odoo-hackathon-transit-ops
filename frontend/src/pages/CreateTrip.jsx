/**
 * CreateTrip.jsx
 * Form for creating a new trip (always starts as 'Draft' per
 * STATUS_TRANSITIONS.md). Only performs basic input validation on the
 * frontend — all business validation happens in the backend
 * (BUSINESS_RULES.md, "General Rules").
 *
 * Depends on Developer 2's vehicleService.js / driverService.js to
 * populate the vehicle and driver dropdowns.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tripService from '../services/tripService';
//import vehicleService from '../services/vehicleService';
//import driverService from '../services/driverService';

const INITIAL_FORM = {
  vehicle_id: '',
  driver_id: '',
  source: '',
  destination: '',
  cargo_weight: '',
  planned_distance: '',
};

function CreateTrip() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [vehicleRes, driverRes] = await Promise.all([
          //vehicleService.getAllVehicles(),
          //driverService.getAllDrivers(),
        ]);
        setVehicles(vehicleRes.data.data);
        setDrivers(driverRes.data.data);
      } catch (err) {
        setLoadError(err.response?.data?.message || 'Failed to load vehicles or drivers.');
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      await tripService.createTrip(form);
      navigate('/trips');
    } catch (err) {
      setErrors(err.response?.data?.errors || [err.response?.data?.message || 'Failed to create trip.']);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) return <p className="error-text">{loadError}</p>;

  return (
    <div className="create-trip-page">
      <h1>Create Trip</h1>

      {errors.length > 0 && (
        <ul className="error-list">
          {errors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="create-trip-form">
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
          Driver
          <select name="driver_id" value={form.driver_id} onChange={handleChange} required>
            <option value="">Select driver</option>
            {drivers.map((d) => (
              <option key={d.driver_id} value={d.driver_id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Source
          <input name="source" value={form.source} onChange={handleChange} required />
        </label>

        <label>
          Destination
          <input name="destination" value={form.destination} onChange={handleChange} required />
        </label>

        <label>
          Cargo Weight
          <input
            type="number"
            step="0.01"
            min="0"
            name="cargo_weight"
            value={form.cargo_weight}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Planned Distance
          <input
            type="number"
            step="0.01"
            min="0"
            name="planned_distance"
            value={form.planned_distance}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Trip'}
        </button>
      </form>
    </div>
  );
}

export default CreateTrip;
