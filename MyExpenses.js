import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { expensesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getStatusLabel, getCategoryLabel } from '../../utils/helpers';

const STATUS_TABS = ['all', 'in_review', 'approved', 'rejected', 'draft'];

const MyExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const sym = user?.company?.currency?.symbol || '$';
  const code = user?.company?.currency?.code || 'USD';

  useEffect(() => {
    setLoading(true);
    const params = activeTab !== 'all' ? { status: activeTab } : {};
    expensesAPI.getMy(params)
      .then(res => setExpenses(res.data.expenses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Expenses</h1>
          <p className="page-subtitle">Track and manage your reimbursement requests</p>
        </div>
        <Link to="/expenses/submit" className="btn btn-primary">➕ New Expense</Link>
      </div>

      <div className="tab-nav">
        {STATUS_TABS.map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'all' ? 'All' : getStatusLabel(t)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <h3>No expenses found</h3>
            <p>Submit your first expense claim to get started</p>
            <Link to="/expenses/submit" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>Submit Expense</Link>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Approvals</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => {
                  const approvedSteps = e.approvalSteps?.filter(s => s.status === 'approved').length || 0;
                  const totalSteps = e.approvalSteps?.length || 0;
                  return (
                    <tr key={e._id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{e.title}</div>
                        {e.description && <div className="text-sm text-muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>}
                      </td>
                      <td>{getCategoryLabel(e.category)}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>
                        <div>{e.currency?.symbol}{parseFloat(e.amount).toFixed(2)} <span className="text-muted" style={{ fontSize: 11 }}>{e.currency?.code}</span></div>
                        {e.currency?.code !== code && (
                          <div className="text-sm" style={{ color: 'var(--accent)' }}>{sym}{(e.amountInCompanyCurrency || 0).toFixed(2)}</div>
                        )}
                      </td>
                      <td className="text-muted">{formatDate(e.date)}</td>
                      <td><span className={`badge badge-${e.status}`}>{getStatusLabel(e.status)}</span></td>
                      <td>
                        {totalSteps > 0 ? (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--success)' }}>{approvedSteps}</span>/{totalSteps} approved
                          </div>
                        ) : <span className="text-muted text-sm">—</span>}
                      </td>
                      <td>
                        <Link to={`/expenses/${e._id}`} className="btn btn-ghost btn-sm">View →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyExpenses;
