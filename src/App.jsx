import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Pairing from './pages/Pairing';
import Dashboard from './pages/Dashboard';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PairedRoute = ({ children }) => {
  const { user, relationship } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!relationship) return <Navigate to="/pairing" replace />;
  return children;
};

const AppRoutes = () => {
  const { user, relationship } = useAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          !user ? <Navigate to="/login" replace /> :
          !relationship ? <Navigate to="/pairing" replace /> :
          <Navigate to="/dashboard" replace />
        } 
      />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/pairing" 
        element={
          <ProtectedRoute>
            {relationship ? <Navigate to="/dashboard" replace /> : <Pairing />}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <PairedRoute>
            <Dashboard />
          </PairedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
