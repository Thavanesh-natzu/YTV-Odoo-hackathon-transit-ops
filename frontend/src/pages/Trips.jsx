/**
 * Trips.jsx
 * Lists all trips and exposes the status-transition actions
 * (Dispatch / Complete / Cancel) defined in API_SPEC.md and
 * STATUS_TRANSITIONS.md. The frontend never sets status values directly —
 * it only calls the dedicated backend endpoints.
 */

import { useEffect, useState, useCallback } from 'react';
import tripService from '../services/tripService';

const STATUS_BADGE_CLASS = {
  Draft: 'badge badge-draft',
  Dispatched: 'badge badge-dispatched',
  Completed: 'badge badge-completed',
  Cancelled: 'badge badge-cancelled',
};

function extractErrorMessage(err, fallback) {
  return err.response?.data?.errors?.join(', ') || err.response?.data?.message || fallback;
}

function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busyTripId, setBusyTripId] = useState(null);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await tripService.getAllTrips();
      setTrips(response.data.data);
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Failed to load trips.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const runAction = async (tripId, action, fallbackMessage) => {
    setActionError(null);
    setBusyTripId(tripId);
    try {
      await action();
      await loadTrips();
    } catch (err) {
      setActionError(extractErrorMessage(err, fallbackMessage));
    } finally {
      setBusyTripId(null);
    }
  };

  const handleDispatch = (tripId) =>
    runAction(tripId, () => tripService.dispatchTrip(tripId), 'Failed to dispatch trip.');

  const handleComplete = (tripId) =>
    runAction(tripId, () => tripService.completeTrip(tripId), 'Failed to complete trip.');

  const handleCancel = (tripId) =>
    runAction(tripId, () => tripService.cancelTrip(tripId), 'Failed to cancel trip.');

  if (loading) return <p>Loading trips...</p>;
  if (loadError) return <p className="error-text">{loadError}</p>;

  return (
    <div className="trips-page">
      <div className="page-header">
        <h1>Trips</h1>
      </div>

      {actionError && <p className="error-text">{actionError}</p>}

      {trips.length === 0 ? (
        <p className="empty-state">No trips yet. Create one to get started.</p>
      ) : (
        <table className="trips-table">
          <thead>
            <tr>
              <th>Trip ID</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Cargo Weight</th>
              <th>Planned Distance</th>
              <th>Actual Distance</th>
              <th>Revenue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => {
              const isBusy = busyTripId === trip.trip_id;
              return (
                <tr key={trip.trip_id}>
                  <td>{trip.trip_id}</td>
                  <td>{trip.source}</td>
                  <td>{trip.destination}</td>
                  <td>{trip.cargo_weight}</td>
                  <td>{trip.planned_distance}</td>
                  <td>{trip.actual_distance ?? '-'}</td>
                  <td>{trip.revenue}</td>
                  <td>
                    <span className={STATUS_BADGE_CLASS[trip.status]}>{trip.status}</span>
                  </td>
                  <td>
                    {trip.status === 'Draft' && (
                      <>
                        <button disabled={isBusy} onClick={() => handleDispatch(trip.trip_id)}>
                          Dispatch
                        </button>
                        <button disabled={isBusy} onClick={() => handleCancel(trip.trip_id)}>
                          Cancel
                        </button>
                      </>
                    )}
                    {trip.status === 'Dispatched' && (
                      <>
                        <button disabled={isBusy} onClick={() => handleComplete(trip.trip_id)}>
                          Complete
                        </button>
                        <button disabled={isBusy} onClick={() => handleCancel(trip.trip_id)}>
                          Cancel
                        </button>
                      </>
                    )}
                    {(trip.status === 'Completed' || trip.status === 'Cancelled') && <span>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Trips;
