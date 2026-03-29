import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { expensesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getStatusLabel, getCategoryLabel, getInitials, getAvatarColor } from '../../utils/helpers';

const TeamExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const sym = user?.company?.currency?.symbol || '$';

  useEffect(() => {
    setLoading(true);
    const params = filter !== 'all' ? { status: filter } : {};
    expensesAPI.getTeam(params)
      .then(res => setExpenses(res.data.expenses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const statuses = ['all', 'in_review', 'approved', 'rejected'];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Team Expenses</h1>
        <p className="page-subtitle">Expenses from your direct reports</p>
      </div>

      <div className="tab-nav">
        {statuses.map(s => (
          <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : getStatusLabel(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>
      ) : expenses.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon">👥</div><h3>No team expenses</h3></div></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Employee</th><th>Expense</th><th>Category</th><th>Amount</th><th>Date</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm" style={{ background: getAvatarColor(e.submittedBy?.name) }}>
                          {getInitials(e.submittedBy?.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{e.submittedBy?.name}</div>
                          <div className="text-sm text-muted">{e.submittedBy?.department || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{e.title}</td>
                    <td>{getCategoryLabel(e.category)}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>
                      {sym}{(e.amountInCompanyCurrency || 0).toFixed(2)}
                    </td>
                    <td className="text-muted">{formatDate(e.date)}</td>
                    <td><span className={`badge badge-${e.status}`}>{getStatusLabel(e.status)}</span></td>
                    <td><Link to={`/expenses/${e._id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamExpenses;
