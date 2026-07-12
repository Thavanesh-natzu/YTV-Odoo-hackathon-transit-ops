import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Moon, Sun, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Navbar.jsx
 * -----------------------------------------------------------------------
 * Top navigation bar. Fades in on mount, hosts the dark-mode toggle
 * (backed by ThemeContext, a shared file — no local theme state here)
 * and a live clock as a small HUD-flavored touch.
 * -----------------------------------------------------------------------
 */

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function Navbar({ user, notificationCount = 0, onSearch }) {
  const { isDark, toggleTheme } = useTheme();
  const now = useLiveClock();

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        height: 'var(--navbar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        padding: '0 var(--space-5)',
        borderBottom: '1px solid var(--color-panel-border)',
        background: 'var(--color-panel-glass)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flex: 1,
          maxWidth: 420,
          padding: '8px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-panel-border)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <Search size={16} color="var(--color-text-muted)" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search vehicles, drivers, trips…"
          onChange={(e) => onSearch?.(e.target.value)}
          aria-label="Search TransitOps"
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--fs-sm)',
            width: '100%',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <span
          className="mono"
          style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}
        >
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 34,
            height: 34,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-panel-border)',
            background: 'transparent',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          type="button"
          aria-label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ''}`}
          style={{
            position: 'relative',
            width: 34,
            height: 34,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-panel-border)',
            background: 'transparent',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          <Bell size={16} />
          {notificationCount > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                minWidth: 16,
                height: 16,
                padding: '0 3px',
                borderRadius: 999,
                background: 'var(--color-danger)',
                fontSize: 10,
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
              }}
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              aria-hidden="true"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-info))',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                color: '#04141A',
                fontSize: 13,
              }}
            >
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{user.role}</div>
            </div>
          </div>
        )}
      </div>
    </motion.header>
  );
}
