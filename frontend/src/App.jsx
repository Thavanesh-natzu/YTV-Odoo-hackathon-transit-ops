import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Layout components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import PageTransition from './components/layout/PageTransition';

// Page components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
//import Vehicles from './pages/Vehicles';
//import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import CreateTrip from './pages/CreateTrip';
import Maintenance from './pages/Maintenance';
import FuelLogs from './pages/FuelLogs';

/**
 * ProtectedRoute Component
 * -----------------------------------------------------------------------
 * Wraps authenticated routes with layout (Navbar + Sidebar + PageTransition)
 * Redirects unauthenticated users to /login
 * -----------------------------------------------------------------------
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const [activeNavKey, setActiveNavKey] = React.useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const handleNavigate = (key) => {
    setActiveNavKey(key);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        activeKey={activeNavKey}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={setSidebarCollapsed}
      />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Navbar user={user} notificationCount={0} onSearch={() => {}} />
        <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          <PageTransition routeKey={activeNavKey}>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}

/**
 * AppContent Component
 * -----------------------------------------------------------------------
 * Routes configuration. Keeps routing logic modular and maintainable.
 * -----------------------------------------------------------------------
 */
function AppContent() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Authenticated routes with layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/trips"
        element={
          <ProtectedRoute>
            <Trips />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-trip"
        element={
          <ProtectedRoute>
            <CreateTrip />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <Maintenance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fuel"
        element={
          <ProtectedRoute>
            <FuelLogs />
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

/**
 * App Component
 * -----------------------------------------------------------------------
 * Root application component. Configures React Router and wraps the
 * application with:
 *   - ThemeProvider (from ThemeContext.jsx)
 *   - AuthProvider (from hooks/useAuth.js)
 *   - BrowserRouter (for client-side routing)
 *
 * Per PROJECT_STRUCTURE.md:
 *   - App.jsx is a SHARED file (file ownership)
 *   - Navbar and Sidebar are only rendered for authenticated users
 *   - PageTransition wraps route content for smooth transitions
 *   - All pages are imported and used exactly as specified
 * -----------------------------------------------------------------------
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
