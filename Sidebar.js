import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import './Sidebar.css';

const NavItem = ({ to, icon, label, badge }) => (
  <NavLink to={to} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
    <span className="nav-icon">{icon}</span>
    <span className="nav-label">{label}</span>
    {badge > 0 && <span className="nav-badge">{badge}</span>}
  </NavLink>
);

const Sidebar = ({ pendingCount = 0 }) => {
  const { user, logout, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">💸</div>
        <div>
          <div className="logo-name">ReimburseFlow</div>
          <div className="logo-company">{user?.company?.name}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        <NavItem to="/dashboard" icon="📊" label="Dashboard" />
        <NavItem to="/expenses/my" icon="🧾" label="My Expenses" />
        <NavItem to="/expenses/submit" icon="➕" label="Submit Expense" />

        {isManager && (
          <>
            <div className="nav-section-label">Approvals</div>
            <NavItem to="/approvals" icon="✅" label="Pending Approvals" badge={pendingCount} />
            <NavItem to="/expenses/team" icon="👥" label="Team Expenses" />
          </>
        )}

        {isAdmin && (
          <>
            <div className="nav-section-label">Admin</div>
            <NavItem to="/admin/users" icon="👤" label="Users" />
            <NavItem to="/admin/expenses" icon="📋" label="All Expenses" />
            <NavItem to="/admin/rules" icon="⚙️" label="Approval Rules" />
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className="sidebar-profile">
          <div className="avatar" style={{ background: getAvatarColor(user?.name) }}>
            {getInitials(user?.name)}
          </div>
          <div className="profile-info">
            <div className="profile-name">{user?.name}</div>
            <div className="profile-role">{user?.role}</div>
          </div>
        </NavLink>
        <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
          🚪
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
