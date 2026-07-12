import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * ThemeContext.jsx
 * -----------------------------------------------------------------------
 * Global application state for theme (dark / light mode).
 * This is a SHARED file per PROJECT_STRUCTURE.md ("File Ownership") —
 * only the theme concern lives here, no business/domain state.
 *
 * Applies `data-theme="dark" | "light"` on <html>, which globals.css
 * reads to swap CSS custom properties. Persists the choice locally so a
 * demo reload doesn't flash back to the default.
 * -----------------------------------------------------------------------
 */

const STORAGE_KEY = 'transitops-theme';
const ThemeContext = createContext(undefined);

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch (err) {
    // localStorage unavailable (private mode, etc.) — fall through to default
  }
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {
      // ignore persistence errors — theme still applies for this session
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

export default ThemeContext;
