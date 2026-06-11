// src/components/auth/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../shared/UI';

export const ProtectedRoute = ({ children, requireSuperowner = false }) => {
  const { user, loading, isSuperowner, activeCompany } = useAuth();

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Spinner size={40} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireSuperowner && !isSuperowner) return <Navigate to="/dashboard" replace />;
  if (!isSuperowner && !activeCompany) return <Navigate to="/login" replace />;

  return children;
};

export const PublicRoute = ({ children }) => {
  const { user, loading, isSuperowner } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={isSuperowner ? '/superowner' : '/dashboard'} replace />;
  return children;
};
