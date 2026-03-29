import React, { useState, useEffect } from 'react';
import { companyAPI, usersAPI } from '../../services/api';
import { CATEGORIES } from '../../utils/helpers';
import toast from 'react-hot-toast';

const STEP_TYPES = [
  { value: 'user', label: 'Specific User' },
  { value: 'manager', label: "Submitter's Manager" },
  { value: 'role', label: 'By Role' },
];

const emptyStep = { order: 0, approverType: 'user', approverId: '', approverRole: '', isManagerApprover: false, label: '' };
const emptyRule = {
  name: '', description: '', type: 'sequential',
  steps: [], conditions: { conditionType: 'percentage', percentageApproval: 100, specificApproverIds: [] },
  isDefault: false, categories: [], amountThreshold: { min: '', max: '' }
};

const AdminRules = () => {
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyRule);

  useEffect(() => {
    Promise.all([companyAPI.getRules(), usersAPI.getAll()])
      .then(([rulesRes, usersRes]) => {
        setRules(rulesRes.data.rules || []);
        setUsers(usersRes.data.users || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditRule(null); setForm({ ...emptyRule, steps: [] }); setShowModal(true); };
  const openEdit = (r) => {
    setEditRule(r);
    setForm({ ...r, steps: r.steps || [], conditions: r.conditions || emptyRule.conditions, amountThreshold: r.amountThreshold || { min: '', max: '' }, categories: r.categories || [] });
    setShowModal(true);
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setCondition = (k, v) => setForm(p => ({ ...p, conditions: { ...p.conditions, [k]: v } }));

  const addStep = () => setForm(p => ({ ...p, steps: [...p.steps, { ...emptyStep, order: p.steps.length }] }));
  const updateStep = (i, k, v) => setForm(p => {
    const steps = [...p.steps];
    steps[i] = { ...steps[i], [k]: v };
    return { ...p, steps };
  });
  const removeStep = (i) => setForm(p => ({ ...p, steps: p.steps.filter((_, idx) => idx !== i) }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let res;
      if (editRule) {
        res = await companyAPI.updateRule(editRule._id, form);
      } else {
        res = await companyAPI.createRule(form);
      }
      setRules(res.data.rules || []);
      setShowModal(false);
      toast.success(editRule ? 'Rule updated' : 'Rule created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId, ruleName) => {
    if (!window.confirm(`Delete rule "${ruleName}"?`)) return;
    try {
      const res = await companyAPI.deleteRule(ruleId);
      setRules(res.data.rules || []);
      toast.success('Rule deleted');
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Approval Rules</h1>
          <p className="page-subtitle">Configure multi-level approval workflows</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>➕ New Rule</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>
      ) : rules.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚙️</div>
            <h3>No approval rules</h3>
            <p>Create your first rule to define how expenses get approved</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={openCreate}>Create Rule</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rules.map(r => (
            <div key={r._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontWeight: 600, fontSize: 16 }}>{r.name}</h3>
                    {r.isDefault && <span className="badge badge-approved">Default</span>}
                    {!r.isActive && <span className="badge badge-rejected">Inactive</span>}
                  </div>
                  {r.description && <p className="text-sm text-muted" style={{ marginTop: 4 }}>{r.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>Edit</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(r._id, r.name)}>Delete</button>
                </div>
              </div>

              {/* Steps */}
              {r.steps?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span className="text-sm text-muted">Steps:</span>
                  {r.steps.map((s, i) => (
                    <React.Fragment key={i}>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                        {s.label || s.approverRole || `Step ${i + 1}`}
                      </span>
                      {i < r.steps.length - 1 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Conditions */}
              {r.conditions?.conditionType && (
                <div className="alert alert-info" style={{ marginTop: 8 }}>
                  <span>⚡</span>
                  <div className="text-sm">
                    {r.conditions.conditionType === 'percentage' && `Approved when ${r.conditions.percentageApproval}% of approvers approve`}
                    {r.conditions.conditionType === 'specific' && `Approved when specific approver approves`}
                    {r.conditions.conditionType === 'hybrid' && `Approved when ${r.conditions.percentageApproval}% approve OR specific approver approves`}
                  </div>
                </div>
              )}

              {(r.amountThreshold?.min || r.amountThreshold?.max) && (
                <div className="text-sm text-muted" style={{ marginTop: 8 }}>
                  💰 Applies to amounts: {r.amountThreshold.min ? `from ${r.amountThreshold.min}` : ''} {r.amountThreshold.max ? `up to ${r.amountThreshold.max}` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editRule ? 'Edit Approval Rule' : 'New Approval Rule'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Rule Name *</label>
                  <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Standard Approval" required />
                </div>
                <div className="input-group">
                  <label className="input-label">Type</label>
                  <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
                    <option value="sequential">Sequential</option>
                    <option value="conditional">Conditional</option>
                    <option value="hybrid">Hybrid (Both)</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <input className="input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe when this rule applies..." />
              </div>

              {/* Amount Threshold */}
              <div>
                <div className="input-label" style={{ marginBottom: 8 }}>Amount Threshold (optional)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: 11 }}>Min Amount</label>
                    <input className="input" type="number" placeholder="0" value={form.amountThreshold?.min || ''} onChange={e => set('amountThreshold', { ...form.amountThreshold, min: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: 11 }}>Max Amount</label>
                    <input className="input" type="number" placeholder="No limit" value={form.amountThreshold?.max || ''} onChange={e => set('amountThreshold', { ...form.amountThreshold, max: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div className="input-label">Approval Steps</div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addStep}>+ Add Step</button>
                </div>
                {form.steps.length === 0 ? (
                  <p className="text-sm text-muted">No steps added. Expenses will be auto-approved.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {form.steps.map((step, i) => (
                      <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontWeight: 500, fontSize: 13 }}>Step {i + 1}</span>
                          <button type="button" className="btn btn-ghost btn-icon" style={{ fontSize: 12 }} onClick={() => removeStep(i)}>✕</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                          <div className="input-group">
                            <label className="input-label" style={{ fontSize: 11 }}>Approver Type</label>
                            <select className="select" value={step.approverType} onChange={e => updateStep(i, 'approverType', e.target.value)}>
                              {STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                          {step.approverType === 'user' && (
                            <div className="input-group">
                              <label className="input-label" style={{ fontSize: 11 }}>Select User</label>
                              <select className="select" value={step.approverId} onChange={e => updateStep(i, 'approverId', e.target.value)}>
                                <option value="">Select...</option>
                                {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                              </select>
                            </div>
                          )}
                          {step.approverType === 'role' && (
                            <div className="input-group">
                              <label className="input-label" style={{ fontSize: 11 }}>Role</label>
                              <input className="input" placeholder="e.g. Finance, Director" value={step.approverRole} onChange={e => updateStep(i, 'approverRole', e.target.value)} />
                            </div>
                          )}
                          <div className="input-group">
                            <label className="input-label" style={{ fontSize: 11 }}>Label</label>
                            <input className="input" placeholder="e.g. Manager, CFO, Finance" value={step.label} onChange={e => updateStep(i, 'label', e.target.value)} />
                          </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 13, cursor: 'pointer' }}>
                          <input type="checkbox" checked={step.isManagerApprover} onChange={e => updateStep(i, 'isManagerApprover', e.target.checked)} />
                          Use submitter's direct manager as approver
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conditions */}
              {(form.type === 'conditional' || form.type === 'hybrid') && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                  <div className="input-label" style={{ marginBottom: 12 }}>Conditional Approval Settings</div>
                  <div className="input-group" style={{ marginBottom: 12 }}>
                    <label className="input-label" style={{ fontSize: 11 }}>Condition Type</label>
                    <select className="select" value={form.conditions?.conditionType || 'percentage'} onChange={e => setCondition('conditionType', e.target.value)}>
                      <option value="percentage">Percentage of approvers</option>
                      <option value="specific">Specific approver must approve</option>
                      <option value="hybrid">Hybrid (percentage OR specific)</option>
                    </select>
                  </div>
                  {(form.conditions?.conditionType === 'percentage' || form.conditions?.conditionType === 'hybrid') && (
                    <div className="input-group" style={{ marginBottom: 12 }}>
                      <label className="input-label" style={{ fontSize: 11 }}>Required Approval Percentage (%)</label>
                      <input className="input" type="number" min="1" max="100" value={form.conditions?.percentageApproval || 100}
                        onChange={e => setCondition('percentageApproval', parseInt(e.target.value))} />
                    </div>
                  )}
                  {(form.conditions?.conditionType === 'specific' || form.conditions?.conditionType === 'hybrid') && (
                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: 11 }}>Specific Approvers (any one is sufficient)</label>
                      <select className="select" multiple style={{ height: 100 }}
                        value={form.conditions?.specificApproverIds || []}
                        onChange={e => setCondition('specificApproverIds', Array.from(e.target.selectedOptions, o => o.value))}>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.isDefault} onChange={e => set('isDefault', e.target.checked)} style={{ width: 16, height: 16 }} />
                <span>Set as default rule <span className="text-muted">(applied to all new expenses)</span></span>
              </label>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : null} {editRule ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRules;
