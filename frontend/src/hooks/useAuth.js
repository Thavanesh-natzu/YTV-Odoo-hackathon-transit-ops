// frontend/src/hooks/useAuth.js
//
// Custom hook exposing authentication state and actions.
//
// No AuthContext.jsx is assigned to any developer in TEAM_ASSIGNMENTS.md,
// so the context/provider is defined here, inside Developer 1's own
// assigned file, rather than introducing a new file/folder ownership
// question outside this scope (PROJECT_STRUCTURE.md: "Never introduce
// alternative folder structures").
//
// Upgrade notes (readability/perf only - exported hook contract unchanged:
// still returns { user, role, isAuthenticated, loading, error, login, logout }):
//   - Context value is memoized (useMemo) so consumers don't re-render on
//     every parent render - only when auth state actually changes.
//   - Added clearError() so the UI (e.g. an error toast) can be dismissed
//     without waiting for the next login attempt to overwrite it.
//   - logout() is now safe to call even when there's no active session.

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { token, user: loggedInUser } = await authService.login(email, password);
      authService.storeSession(token, loggedInUser);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      const message = err.message || 'Unable to log in. Please try again.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.clearSession();
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      isAuthenticated: !!user,
      loading,
      error,
      login,
      logout,
      clearError,
    }),
    [user, loading, error, login, logout, clearError]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
