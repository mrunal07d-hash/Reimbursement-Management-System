import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';

import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import MyExpenses from './pages/MyExpenses';
import SubmitExpense from './pages/SubmitExpense';
import ExpenseDetail from './pages/ExpenseDetail';
import PendingApprovals from './pages/PendingApprovals';
import TeamExpenses from './pages/TeamExpenses';
import AdminUsers from './pages/AdminUsers';
import AdminExpenses from './pages/AdminExpenses';
import AdminRules from './pages/AdminRules';
import Profile from './pages/Profile';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <div className="spinner spinner-lg" />
      <span style={{ color: 'var(--text-muted)', marginTop: 12 }}>Loading...</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><AuthPage /></PublicRoute>} />

    <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="expenses/my" element={<MyExpenses />} />
      <Route path="expenses/submit" element={<SubmitExpense />} />
      <Route path="expenses/team" element={
        <PrivateRoute roles={['manager', 'admin']}><TeamExpenses /></PrivateRoute>
      } />
      <Route path="expenses/:id" element={<ExpenseDetail />} />
      <Route path="approvals" element={
        <PrivateRoute roles={['manager', 'admin']}><PendingApprovals /></PrivateRoute>
      } />
      <Route path="admin/users" element={
        <PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>
      } />
      <Route path="admin/expenses" element={
        <PrivateRoute roles={['admin']}><AdminExpenses /></PrivateRoute>
      } />
      <Route path="admin/rules" element={
        <PrivateRoute roles={['admin']}><AdminRules /></PrivateRoute>
      } />
      <Route path="profile" element={<Profile />} />
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: 'white' } },
          error: { iconTheme: { primary: 'var(--danger)', secondary: 'white' } },
        }}
      />
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
