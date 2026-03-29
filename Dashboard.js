import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { expensesAPI } from '../../services/api';
import { formatCurrency, formatDate, getStatusLabel, getCategoryLabel, timeAgo } from '../../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Dashboard = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    expensesAPI.getDashboard().then(res => {
      setStats(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const currency = user?.company?.currency;
  const sym = currency?.symbol || '$';

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner spinner-lg" />
      <span className="text-muted">Loading dashboard...</span>
    </div>
  );

  const s = stats?.stats || {};
  const recent = stats?.recentExpenses || [];

  const categoryData = recent.reduce((acc, e) => {
    const cat = e.category || 'other';
    const ex = acc.find(a => a.name === cat);
    if (ex) ex.value += e.amountInCompanyCurrency || 0;
    else acc.push({ name: cat, value: e.amountInCompanyCurrency || 0 });
    return acc;
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's what's happening with your expenses</p>
      </div>

      <div className="grid-stats">
        <div className="stat-card blue">
          <div className="stat-icon">🧾</div>
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">{s.total || 0}</div>
          <div className="stat-sub">All time</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon">⏳</div>
          <div className="stat-label">Pending Review</div>
          <div className="stat-value">{s.pending || 0}</div>
          <div className="stat-sub">Awaiting approval</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Approved</div>
          <div className="stat-value">{s.approved || 0}</div>
          <div className="stat-sub">Successfully reimbursed</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">❌</div>
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{s.rejected || 0}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Total Reimbursed</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            {formatCurrency(s.totalApprovedAmount, currency?.code, sym)}
          </div>
          <div className="stat-sub">In {currency?.code || 'USD'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {categoryData.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Spending by Category</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }) => getCategoryLabel(name).split(' ')[1] || name}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v, currency?.code, sym)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/expenses/submit" className="btn btn-primary">
              ➕ Submit New Expense
            </Link>
            <Link to="/expenses/my" className="btn btn-secondary">
              🧾 View My Expenses
            </Link>
            {isManager && (
              <Link to="/approvals" className="btn btn-secondary">
                ✅ Review Approvals
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/users" className="btn btn-secondary">
                👥 Manage Users
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Expenses</h3>
          <Link to="/expenses/my" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <h3>No expenses yet</h3>
            <p><Link to="/expenses/submit" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Submit your first expense</Link></p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(e => (
                  <tr key={e._id}>
                    <td>
                      <Link to={`/expenses/${e._id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                        {e.title}
                      </Link>
                      {e.submittedBy?.name && isAdmin && (
                        <div className="text-sm text-muted">{e.submittedBy.name}</div>
                      )}
                    </td>
                    <td>{getCategoryLabel(e.category)}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>
                      {formatCurrency(e.amountInCompanyCurrency, currency?.code, sym)}
                    </td>
                    <td className="text-muted">{formatDate(e.date)}</td>
                    <td><span className={`badge badge-${e.status}`}>{getStatusLabel(e.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

export default Dashboard;
