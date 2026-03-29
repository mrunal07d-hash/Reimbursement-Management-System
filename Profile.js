import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { getInitials, getAvatarColor, formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', department: user?.department || '', position: user?.position || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile(profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    setSavingPw(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div className="avatar avatar-lg" style={{ width: 64, height: 64, fontSize: 24, background: getAvatarColor(user?.name) }}>
            {getInitials(user?.name)}
          </div>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 20 }}>{user?.name}</h2>
            <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, textTransform: 'capitalize' }}>{user?.role}</span>
              <span className="text-sm text-muted">{user?.email}</span>
              <span className="text-sm text-muted">·</span>
              <span className="text-sm text-muted">{user?.company?.name}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input className="input" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input" value={user?.email} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="input-group">
              <label className="input-label">Department</label>
              <input className="input" value={profileForm.department} onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Engineering" />
            </div>
            <div className="input-group">
              <label className="input-label">Position</label>
              <input className="input" value={profileForm.position} onChange={e => setProfileForm(p => ({ ...p, position: e.target.value }))} placeholder="e.g. Software Engineer" />
            </div>
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? <span className="spinner" /> : null} Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Company Info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card-title" style={{ marginBottom: 16 }}>Company Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { label: 'Company', value: user?.company?.name },
            { label: 'Country', value: user?.company?.country },
            { label: 'Currency', value: `${user?.company?.currency?.code} (${user?.company?.currency?.symbol})` },
          ].map(item => (
            <div key={item.label}>
              <div className="text-sm text-muted" style={{ marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontWeight: 500 }}>{item.value || '—'}</div>
            </div>
          ))}
        </div>
        {user?.manager && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Reports To</div>
            <div style={{ fontWeight: 500 }}>{user.manager.name}</div>
            <div className="text-sm text-muted">{user.manager.email}</div>
          </div>
        )}
        {user?.lastLogin && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div className="text-sm text-muted">Last login: {formatDateTime(user.lastLogin)}</div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 16 }}>Change Password</h3>
        <form onSubmit={handlePwSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">Current Password</label>
            <input className="input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="input-group">
              <label className="input-label">New Password</label>
              <input className="input" type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} minLength={6} required />
            </div>
            <div className="input-group">
              <label className="input-label">Confirm New Password</label>
              <input className="input" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
            </div>
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={savingPw}>
              {savingPw ? <span className="spinner" /> : null} Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
