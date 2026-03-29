import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ROLE_COLORS = { admin: 'var(--purple)', manager: 'var(--primary)', employee: 'var(--text-secondary)' };

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const emptyForm = { name: '', email: '', password: '', role: 'employee', managerId: '', department: '', position: '', isManagerApprover: false };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, managersRes] = await Promise.all([usersAPI.getAll(), usersAPI.getManagers()]);
      setUsers(usersRes.data.users || []);
      setManagers(managersRes.data.managers || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditUser(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, managerId: u.manager?._id || '', department: u.department || '', position: u.position || '', isManagerApprover: u.isManagerApprover || false });
    setShowModal(true);
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editUser) {
        const res = await usersAPI.update(editUser._id, form);
        setUsers(p => p.map(u => u._id === editUser._id ? res.data.user : u));
        toast.success('User updated');
      } else {
        const res = await usersAPI.create(form);
        setUsers(p => [...p, res.data.user]);
        toast.success('User created! Default password: Password@123');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (u) => {
    if (!window.confirm(`Deactivate ${u.name}?`)) return;
    try {
      await usersAPI.delete(u._id);
      setUsers(p => p.map(x => x._id === u._id ? { ...x, isActive: false } : x));
      toast.success('User deactivated');
    } catch {
      toast.error('Failed');
    }
  };

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{users.length} users in your company</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>➕ Add User</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input className="input" style={{ maxWidth: 320 }} placeholder="🔍 Search users..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>User</th><th>Role</th><th>Manager</th><th>Department</th><th>Approver</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: getAvatarColor(u.name) }}>{getInitials(u.name)}</div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.name}</div>
                          <div className="text-sm text-muted">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: ROLE_COLORS[u.role], fontWeight: 500, fontSize: 13, textTransform: 'capitalize' }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="text-muted">{u.manager?.name || '—'}</td>
                    <td className="text-muted">{u.department || '—'}</td>
                    <td>
                      {u.isManagerApprover ? (
                        <span className="badge badge-approved">✓ Yes</span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-approved' : 'badge-rejected'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>Edit</button>
                        {u.isActive && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDeactivate(u)}>Deactivate</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editUser ? 'Edit User' : 'Create User'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Full Name *</label>
                  <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Email *</label>
                  <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required disabled={!!editUser} />
                </div>
              </div>
              {!editUser && (
                <div className="input-group">
                  <label className="input-label">Password (default: Password@123)</label>
                  <input className="input" type="password" placeholder="Leave empty for default" value={form.password} onChange={e => set('password', e.target.value)} />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Role</label>
                  <select className="select" value={form.role} onChange={e => set('role', e.target.value)}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Manager</label>
                  <select className="select" value={form.managerId} onChange={e => set('managerId', e.target.value)}>
                    <option value="">No manager</option>
                    {managers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Department</label>
                  <input className="input" value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Engineering" />
                </div>
                <div className="input-group">
                  <label className="input-label">Position</label>
                  <input className="input" value={form.position} onChange={e => set('position', e.target.value)} placeholder="e.g. Software Engineer" />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.isManagerApprover} onChange={e => set('isManagerApprover', e.target.checked)} style={{ width: 16, height: 16 }} />
                <span>Is Manager Approver <span className="text-muted">(expenses routed to this manager first)</span></span>
              </label>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : null} {editUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
