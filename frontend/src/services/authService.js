// frontend/src/services/authService.js
//
// API communication layer for authentication.
// Implements calls to: POST /auth/login (API_SPEC.md)
//
// This file does not create its own Axios instance from scratch - the
// shared `api.js` (frontend/src/services/api.js) is expected to own base
// URL / interceptor configuration (TEAM_ASSIGNMENTS.md lists api.js as a
// shared file). This module imports that shared instance.
//
// Upgrade notes (validation/error-handling only - exported function names
// and their contracts are unchanged):
//   - login() validates inputs before firing the request at all.
//   - Distinguishes a network failure (no response from server) from an
//     API-level rejection (server responded with an error), so the UI can
//     tell "check your connection" apart from "wrong password".
//   - Guards against a malformed success payload (missing token/user)
//     rather than letting a bad response silently break the caller.

import api from './api';

const TOKEN_KEY = 'transitops_token';
const USER_KEY = 'transitops_user';

/**
 * Calls POST /auth/login.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{token: string, user: object}>}
 * @throws {Error} normalized error with a `.message` safe to show in the UI
 */
async function login(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  try {
    const response = await api.post('/auth/login', { email, password });
    const payload = response.data?.data;

    if (!payload?.token || !payload?.user) {
      // The backend responded 200 but not with the shape API_SPEC.md
      // defines - treat as an unexpected failure rather than crashing
      // whatever code destructures the result.
      throw new Error('Unexpected response from the server. Please try again.');
    }

    return payload; // { token, user }
  } catch (err) {
    if (err.response) {
      // Server responded with an error status (400/401/500 etc per API_SPEC.md)
      const message = err.response.data?.message || 'Invalid email or password.';
      const normalized = new Error(message);
      normalized.status = err.response.status;
      throw normalized;
    }

    if (err.request) {
      // Request was sent but no response came back - network/server down.
      throw new Error('Unable to reach the server. Please check your connection.');
    }

    // Something else went wrong (e.g. the malformed-payload case above,
    // or a bug thrown before the request was even made).
    throw err;
  }
}

function storeSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    // Corrupted localStorage value - don't let a bad JSON.parse crash
    // app startup, just treat it as "no stored session".
    clearSession();
    return null;
  }
}

export default {
  login,
  storeSession,
  clearSession,
  getToken,
  getStoredUser,
};
