import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { expensesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
  const { isManager } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isManager) return;
    const fetchPending = async () => {
      try {
        const res = await expensesAPI.getPending();
        setPendingCount(res.data.expenses?.length || 0);
      } catch {}
    };
    fetchPending();
    const interval = setInterval(fetchPending, 60000);
    return () => clearInterval(interval);
  }, [isManager]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar pendingCount={pendingCount} />
      <main style={{
        marginLeft: 'var(--sidebar-w)',
        flex: 1,
        minHeight: '100vh',
        background: 'var(--bg-base)',
        overflow: 'auto'
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
