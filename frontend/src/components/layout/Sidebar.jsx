import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  Receipt,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

/**
 * Sidebar.jsx
 * -----------------------------------------------------------------------
 * Primary navigation. Fades/slides in on mount. Nav entries map to the
 * domains defined in API_SPEC.md (Vehicles, Drivers, Trips, Maintenance,
 * Fuel, Expenses) plus the Dashboard KPI view — no routes are invented
 * beyond what the spec defines.
 * -----------------------------------------------------------------------
 */

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { key: 'vehicles', label: 'Vehicles', icon: Truck, href: '/vehicles' },
  { key: 'drivers', label: 'Drivers', icon: Users, href: '/drivers' },
  { key: 'trips', label: 'Trips', icon: Route, href: '/trips' },
  { key: 'maintenance', label: 'Maintenance', icon: Wrench, href: '/maintenance' },
  { key: 'fuel', label: 'Fuel Logs', icon: Fuel, href: '/fuel' },
  { key: 'expenses', label: 'Expenses', icon: Receipt, href: '/expenses' },
];

export default function Sidebar({ activeKey = 'dashboard', onNavigate, collapsed, onToggleCollapse }) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = collapsed ?? internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) onToggleCollapse(!isCollapsed);
    else setInternalCollapsed((v) => !v);
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Primary"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        borderRight: '1px solid var(--color-panel-border)',
        background: 'var(--color-panel-glass)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        padding: 'var(--space-4) var(--space-2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 var(--space-3)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-info))',
            boxShadow: 'var(--shadow-glow)',
            flexShrink: 0,
          }}
        />
        {!isCollapsed && (
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-lg)' }}>
            TransitOps
          </span>
        )}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV_ITEMS.map(({ key, label, icon: Icon, href }, index) => {
          const active = key === activeKey;
          return (
            <motion.a
              key={key}
              href={href}
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate(key, href);
                }
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: active ? 'rgba(0, 229, 255, 0.10)' : 'transparent',
                borderLeft: active ? '2px solid var(--color-accent)' : '2px solid transparent',
                fontSize: 'var(--fs-sm)',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'background 0.2s var(--ease-hud), color 0.2s var(--ease-hud)',
              }}
            >
              <Icon size={18} aria-hidden="true" />
              {!isCollapsed && <span>{label}</span>}
            </motion.a>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleToggle}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-panel-border)',
          background: 'transparent',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
        }}
      >
        {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        {!isCollapsed && <span style={{ fontSize: 'var(--fs-xs)' }}>Collapse</span>}
      </button>
    </motion.aside>
  );
}
