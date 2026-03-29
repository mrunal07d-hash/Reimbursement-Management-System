import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { expensesAPI, approvalsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, formatDateTime, getStatusLabel, getCategoryLabel, getInitials, getAvatarColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || '';

const ExpenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [comment, setComment] = useState('');
  const [overrideAction, setOverrideAction] = useState('approve');

  const sym = user?.company?.currency?.symbol || '$';
  const code = user?.company?.currency?.code || 'USD';

  useEffect(() => {
    expensesAPI.getById(id)
      .then(res => setExpense(res.data.expense))
      .catch(() => toast.error('Expense not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const canApprove = isManager && expense?.status === 'in_review' &&
    expense?.approvalSteps?.some(s => s.approver?._id === user?._id && s.status === 'pending');

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await approvalsAPI.approve(id, { comment });
      setExpense(res.data.expense);
      toast.success('Expense approved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comment) return toast.error('Please provide a reason');
    setActionLoading(true);
    try {
      const res = await approvalsAPI.reject(id, { comment });
      setExpense(res.data.expense);
      setShowRejectModal(false);
      toast.success('Expense rejected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOverride = async () => {
    setActionLoading(true);
    try {
      const res = await approvalsAPI.override(id, { action: overrideAction, comment });
      setExpense(res.data.expense);
      setShowOverrideModal(false);
      toast.success(`Expense ${overrideAction}d (admin override)`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Override failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;
  if (!expense) return <div className="page"><div className="empty-state"><h3>Expense not found</h3></div></div>;

  const stepStatusIcon = (status) => ({ approved: '✅', rejected: '❌', pending: '⏳', skipped: '⏭️' }[status] || '❓');

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>← Back</button>
          <h1 className="page-title">{expense.title}</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
            <span className={`badge badge-${expense.status}`}>{getStatusLabel(expense.status)}</span>
            <span className="text-muted text-sm">{getCategoryLabel(expense.category)}</span>
            <span className="text-muted text-sm">•</span>
            <span className="text-muted text-sm">{formatDate(expense.date)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {canApprove && (
            <>
              <button className="btn btn-success" onClick={handleApprove} disabled={actionLoading}>
                ✅ Approve
              </button>
              <button className="btn btn-danger" onClick={() => setShowRejectModal(true)} disabled={actionLoading}>
                ❌ Reject
              </button>
            </>
          )}
          {isAdmin && expense.status === 'in_review' && (
            <button className="btn btn-secondary" onClick={() => setShowOverrideModal(true)}>
              ⚡ Override
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Main Info */}
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div>
                <div className="text-sm text-muted">Amount</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', marginTop: 4 }}>
                  {expense.currency?.symbol}{parseFloat(expense.amount).toFixed(2)}
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 6 }}>{expense.currency?.code}</span>
                </div>
                {expense.currency?.code !== code && (
                  <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 4 }}>
                    ≈ {sym}{(expense.amountInCompanyCurrency || 0).toFixed(2)} {code}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted">Submitted By</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <div className="avatar avatar-sm" style={{ background: getAvatarColor(expense.submittedBy?.name) }}>
                    {getInitials(expense.submittedBy?.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{expense.submittedBy?.name}</div>
                    <div className="text-sm text-muted">{expense.submittedBy?.department || expense.submittedBy?.email}</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted">Exchange Rate</div>
                <div style={{ fontFamily: 'var(--mono)', marginTop: 4 }}>
                  {expense.exchangeRate ? `1 ${expense.currency?.code} = ${expense.exchangeRate.toFixed(4)} ${code}` : '—'}
                </div>
              </div>
            </div>

            {expense.description && (
              <>
                <div className="divider" />
                <div>
                  <div className="text-sm text-muted" style={{ marginBottom: 6 }}>Description</div>
                  <p style={{ fontSize: 14, lineHeight: 1.7 }}>{expense.description}</p>
                </div>
              </>
            )}

            {expense.tags?.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {expense.tags.map(t => (
                  <span key={t} style={{ background: 'var(--bg-hover)', padding: '2px 10px', borderRadius: 20, fontSize: 12, color: 'var(--text-secondary)' }}>#{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Expense Lines */}
          {expense.expenseLines?.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>Expense Lines</h3>
              <table>
                <thead>
                  <tr><th>Description</th><th>Category</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {expense.expenseLines.map((l, i) => (
                    <tr key={i}>
                      <td>{l.description || '—'}</td>
                      <td>{getCategoryLabel(l.category)}</td>
                      <td style={{ fontFamily: 'var(--mono)' }}>{expense.currency?.symbol}{(l.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Receipt */}
          {expense.receipt?.url && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 12 }}>Receipt</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>🧾</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{expense.receipt.filename || 'Receipt'}</div>
                  <a href={`${API_URL}${expense.receipt.url}`} target="_blank" rel="noreferrer"
                    className="btn btn-ghost btn-sm" style={{ padding: '4px 0', marginTop: 4 }}>
                    View Receipt →
                  </a>
                </div>
              </div>
              {expense.receipt.ocrData && (
                <div className="alert alert-info" style={{ marginTop: 12 }}>
                  <span>🤖</span>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>OCR Data</div>
                    {expense.receipt.ocrData.vendor && <div className="text-sm">Vendor: {expense.receipt.ocrData.vendor}</div>}
                    {expense.receipt.ocrData.amount && <div className="text-sm">Detected Amount: {expense.receipt.ocrData.amount}</div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Approval Timeline */}
        <div>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 20 }}>Approval Flow</h3>
            {expense.approvalSteps?.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <p className="text-sm text-muted">No approval steps configured</p>
              </div>
            ) : (
              <div className="step-list">
                {expense.approvalSteps.map((step, i) => (
                  <div key={i} className="step-item">
                    <div className={`step-dot ${step.status}`}>
                      {stepStatusIcon(step.status)}
                    </div>
                    <div className="step-content">
                      <div className="step-label">{step.label || step.approverRole || `Step ${step.stepOrder + 1}`}</div>
                      <div className="step-meta">
                        {step.approver?.name || 'Unknown'}
                        {step.actionDate && ` · ${formatDateTime(step.actionDate)}`}
                      </div>
                      {step.comment && <div className="step-comment">"{step.comment}"</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {expense.finalComment && (
              <>
                <div className="divider" />
                <div>
                  <div className="text-sm text-muted" style={{ marginBottom: 6 }}>Final Comment</div>
                  <div className="step-comment">"{expense.finalComment}"</div>
                </div>
              </>
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="card-title" style={{ marginBottom: 12 }}>Timeline</h3>
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Submitted</span>
                <span>{formatDateTime(expense.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Last updated</span>
                <span>{formatDateTime(expense.updatedAt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Status</span>
                <span className={`badge badge-${expense.status}`}>{getStatusLabel(expense.status)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Reject Expense</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowRejectModal(false)}>✕</button>
            </div>
            <p className="text-muted text-sm" style={{ marginBottom: 16 }}>Please provide a reason for rejection. This will be visible to the employee.</p>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label className="input-label">Reason *</label>
              <textarea className="textarea" placeholder="e.g. Missing receipt, amount exceeds limit..." value={comment}
                onChange={e => setComment(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={actionLoading || !comment}>
                {actionLoading ? <span className="spinner" /> : '❌'} Reject Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="modal-overlay" onClick={() => setShowOverrideModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">⚡ Admin Override</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowOverrideModal(false)}>✕</button>
            </div>
            <div className="alert alert-warning" style={{ marginBottom: 16 }}>
              This will bypass the normal approval workflow.
            </div>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Action</label>
              <select className="select" value={overrideAction} onChange={e => setOverrideAction(e.target.value)}>
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label className="input-label">Comment</label>
              <textarea className="textarea" placeholder="Reason for override..." value={comment}
                onChange={e => setComment(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowOverrideModal(false)}>Cancel</button>
              <button className={`btn ${overrideAction === 'approve' ? 'btn-success' : 'btn-danger'}`} onClick={handleOverride} disabled={actionLoading}>
                {actionLoading ? <span className="spinner" /> : '⚡'} Override {overrideAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseDetail;
