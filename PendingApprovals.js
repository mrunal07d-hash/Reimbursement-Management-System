import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { expensesAPI, approvalsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getCategoryLabel, getInitials, getAvatarColor, timeAgo } from '../../utils/helpers';
import toast from 'react-hot-toast';

const PendingApprovals = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMap, setActionMap] = useState({});
  const [commentModal, setCommentModal] = useState(null);
  const [comment, setComment] = useState('');

  const sym = user?.company?.currency?.symbol || '$';
  const code = user?.company?.currency?.code || 'USD';

  const load = () => {
    setLoading(true);
    expensesAPI.getPending()
      .then(res => setExpenses(res.data.expenses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setAction = (id, val) => setActionMap(p => ({ ...p, [id]: val }));

  const handleApprove = async (expenseId) => {
    setAction(expenseId, 'approving');
    try {
      await approvalsAPI.approve(expenseId, { comment: '' });
      toast.success('Expense approved!');
      setExpenses(p => p.filter(e => e._id !== expenseId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setAction(expenseId, null);
    }
  };

  const openReject = (expense) => {
    setCommentModal(expense);
    setComment('');
  };

  const handleReject = async () => {
    if (!comment.trim()) return toast.error('Please provide a reason');
    const id = commentModal._id;
    setAction(id, 'rejecting');
    try {
      await approvalsAPI.reject(id, { comment });
      toast.success('Expense rejected');
      setExpenses(p => p.filter(e => e._id !== id));
      setCommentModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setAction(id, null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Pending Approvals</h1>
        <p className="page-subtitle">
          {loading ? 'Loading...' : `${expenses.length} expense${expenses.length !== 1 ? 's' : ''} awaiting your review`}
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>
      ) : expenses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <h3>All caught up!</h3>
            <p>No expenses waiting for your approval</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {expenses.map(e => {
            const myStep = e.approvalSteps?.find(s => s.approver?._id === user?._id && s.status === 'pending');
            const busy = actionMap[e._id];
            return (
              <div key={e._id} className="card" style={{ padding: 0 }}>
                <div style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div className="avatar avatar-lg" style={{ background: getAvatarColor(e.submittedBy?.name), flexShrink: 0 }}>
                    {getInitials(e.submittedBy?.name)}
                  </div>

                  {/* Main Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <Link to={`/expenses/${e._id}`} style={{ fontWeight: 600, fontSize: 15, color: 'var(--primary)', textDecoration: 'none' }}>
                          {e.title}
                        </Link>
                        <div className="text-sm text-muted" style={{ marginTop: 2 }}>
                          by <strong style={{ color: 'var(--text-secondary)' }}>{e.submittedBy?.name}</strong>
                          {e.submittedBy?.department && ` · ${e.submittedBy.department}`}
                          {' · '}{timeAgo(e.createdAt)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 18 }}>
                          {sym}{(e.amountInCompanyCurrency || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted">{code}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                      <span style={{ background: 'var(--bg-hover)', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>
                        {getCategoryLabel(e.category)}
                      </span>
                      <span style={{ background: 'var(--bg-hover)', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>
                        📅 {formatDate(e.date)}
                      </span>
                      {myStep && (
                        <span style={{ background: 'var(--warning-light)', color: 'var(--warning)', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>
                          Your step: {myStep.label || 'Approval'}
                        </span>
                      )}
                      {e.receipt?.url && (
                        <span style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>
                          🧾 Receipt attached
                        </span>
                      )}
                    </div>

                    {e.description && (
                      <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {e.description.length > 120 ? e.description.slice(0, 120) + '…' : e.description}
                      </p>
                    )}

                    {/* Approval progress */}
                    {e.approvalSteps?.length > 0 && (
                      <div style={{ marginTop: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span className="text-sm text-muted">Flow:</span>
                        {e.approvalSteps.map((step, i) => (
                          <React.Fragment key={i}>
                            <span style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 20,
                              background: step.status === 'approved' ? 'var(--success-light)' :
                                step.status === 'rejected' ? 'var(--danger-light)' :
                                step.status === 'pending' && step.approver?._id === user?._id ? 'var(--warning-light)' : 'var(--bg-hover)',
                              color: step.status === 'approved' ? 'var(--success)' :
                                step.status === 'rejected' ? 'var(--danger)' :
                                step.status === 'pending' && step.approver?._id === user?._id ? 'var(--warning)' : 'var(--text-muted)'
                            }}>
                              {step.label || step.approver?.name || `Step ${i + 1}`}
                            </span>
                            {i < e.approvalSteps.length - 1 && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--bg-surface)', borderRadius: '0 0 var(--radius) var(--radius)' }}>
                  <Link to={`/expenses/${e._id}`} className="btn btn-ghost btn-sm">View Details</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => openReject(e)} disabled={!!busy}>
                    ❌ Reject
                  </button>
                  <button className="btn btn-success btn-sm" onClick={() => handleApprove(e._id)} disabled={!!busy}>
                    {busy === 'approving' ? <span className="spinner" /> : '✅'} Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {commentModal && (
        <div className="modal-overlay" onClick={() => setCommentModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Reject: {commentModal.title}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setCommentModal(null)}>✕</button>
            </div>
            <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
              Rejection reason will be visible to {commentModal.submittedBy?.name}.
            </p>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label className="input-label">Reason for rejection *</label>
              <textarea className="textarea" placeholder="e.g. Receipt missing, amount exceeds policy limit..."
                value={comment} onChange={e => setComment(e.target.value)} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setCommentModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={!comment.trim() || actionMap[commentModal._id]}>
                {actionMap[commentModal._id] ? <span className="spinner" /> : '❌'} Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
