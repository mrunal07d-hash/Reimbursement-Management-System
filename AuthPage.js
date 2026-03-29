import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { currencyAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './Auth.css';

const AuthPage = () => {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', password: '', companyName: '', country: '',
    currency: { code: 'USD', name: 'US Dollar', symbol: '$' }
  });

  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  useEffect(() => {
    if (mode === 'signup') {
      currencyAPI.getAll().then(res => setCurrencies(res.data.currencies || [])).catch(() => {
        setCurrencies([
          { code: 'USD', name: 'US Dollar', symbol: '$' },
          { code: 'EUR', name: 'Euro', symbol: '€' },
          { code: 'GBP', name: 'British Pound', symbol: '£' },
          { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
        ]);
      });
    }
  }, [mode]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        await signup(form);
        toast.success('Company and account created!');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = (code) => {
    const cur = currencies.find(c => c.code === code);
    if (cur) set('currency', cur);
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">💸</div>
          <h1>ReimburseFlow</h1>
          <p>Smart expense reimbursement for modern teams</p>
        </div>
        <div className="auth-features">
          {['Multi-level approval workflows', 'Real-time currency conversion', 'OCR receipt scanning', 'Conditional approval rules', 'Role-based access control'].map(f => (
            <div key={f} className="auth-feature">
              <span className="auth-feature-check">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
            <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Create Account</button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input className="input" type="text" placeholder="John Smith" value={form.name}
                    onChange={e => set('name', e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Company Name</label>
                  <input className="input" type="text" placeholder="Acme Corp" value={form.companyName}
                    onChange={e => set('companyName', e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Country</label>
                  <input className="input" type="text" placeholder="United States" value={form.country}
                    onChange={e => set('country', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Company Currency</label>
                  <select className="select" value={form.currency.code} onChange={e => handleCurrencyChange(e.target.value)}>
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input className="input" type="email" placeholder="you@company.com" value={form.email}
                onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password}
                onChange={e => set('password', e.target.value)} required minLength={6} />
            </div>

            <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="auth-demo">
              <p className="text-muted text-sm" style={{ textAlign: 'center', marginTop: 16 }}>
                Don't have an account?{' '}
                <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={() => setMode('signup')}>
                  Sign up free
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
