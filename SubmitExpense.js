import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../context/AuthContext';
import { expensesAPI, currencyAPI } from '../../services/api';
import { CATEGORIES } from '../../utils/helpers';
import toast from 'react-hot-toast';
import './SubmitExpense.css';

const SubmitExpense = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [ocrDetected, setOcrDetected] = useState(null);

  const companyCurrency = user?.company?.currency;

  const [form, setForm] = useState({
    title: '', description: '', amount: '', category: '',
    date: new Date().toISOString().split('T')[0],
    currency: { code: companyCurrency?.code || 'USD', name: companyCurrency?.name || 'US Dollar', symbol: companyCurrency?.symbol || '$' },
    receipt: null, tags: '', expenseLines: []
  });

  const [convertedAmount, setConvertedAmount] = useState(null);

  useEffect(() => {
    currencyAPI.getAll().then(res => {
      const list = res.data.currencies || [];
      setCurrencies(list);
    }).catch(() => {
      setCurrencies([
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      ]);
    });
  }, []);

  useEffect(() => {
    if (!form.amount || !form.currency.code || !companyCurrency?.code) return;
    if (form.currency.code === companyCurrency.code) {
      setConvertedAmount(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await currencyAPI.convert({ from: form.currency.code, to: companyCurrency.code, amount: form.amount });
        setConvertedAmount(res.data.converted);
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [form.amount, form.currency.code, companyCurrency?.code]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const fd = new FormData();
      fd.append('receipt', file);
      const res = await expensesAPI.uploadReceipt(fd);
      set('receipt', res.data.file);
      if (res.data.ocrData) {
        const ocr = res.data.ocrData;
        setOcrDetected(ocr);
        toast.success('Receipt scanned! Auto-filling detected fields.');
        if (ocr.amount && !form.amount) set('amount', ocr.amount.toString());
        if (ocr.vendor && !form.title) set('title', `Expense at ${ocr.vendor}`);
        if (ocr.date && !form.date) {
          const parsed = new Date(ocr.date);
          if (!isNaN(parsed)) set('date', parsed.toISOString().split('T')[0]);
        }
      }
    } catch {
      toast.error('Failed to upload receipt');
    } finally {
      setUploadingReceipt(false);
    }
  }, [form.amount, form.title, form.date]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [], 'application/pdf': [] }, maxFiles: 1
  });

  const handleCurrencyChange = (code) => {
    const cur = currencies.find(c => c.code === code);
    if (cur) set('currency', cur);
  };

  const addLine = () => setForm(p => ({ ...p, expenseLines: [...p.expenseLines, { description: '', amount: '', category: '' }] }));
  const updateLine = (i, k, v) => setForm(p => {
    const lines = [...p.expenseLines];
    lines[i] = { ...lines[i], [k]: v };
    return { ...p, expenseLines: lines };
  });
  const removeLine = (i) => setForm(p => ({ ...p, expenseLines: p.expenseLines.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.category) {
      return toast.error('Please fill in all required fields');
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        expenseLines: form.expenseLines.map(l => ({ ...l, amount: parseFloat(l.amount) || 0 }))
      };
      const res = await expensesAPI.submit(payload);
      toast.success('Expense submitted successfully!');
      navigate(`/expenses/${res.data.expense._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Submit Expense</h1>
        <p className="page-subtitle">Fill in the details for your reimbursement request</p>
      </div>

      <form onSubmit={handleSubmit} className="expense-form-grid">
        <div className="expense-form-main">
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 20 }}>Expense Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Title *</label>
                <input className="input" placeholder="e.g. Team lunch at Olive Garden" value={form.title}
                  onChange={e => set('title', e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Amount *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select className="select" style={{ width: 110 }} value={form.currency.code}
                      onChange={e => handleCurrencyChange(e.target.value)}>
                      {currencies.map(c => <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>)}
                    </select>
                    <input className="input" type="number" placeholder="0.00" step="0.01" min="0"
                      value={form.amount} onChange={e => set('amount', e.target.value)} required />
                  </div>
                  {convertedAmount != null && (
                    <div className="text-sm" style={{ color: 'var(--accent)', marginTop: 4 }}>
                      ≈ {companyCurrency?.symbol}{convertedAmount.toFixed(2)} {companyCurrency?.code}
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label className="input-label">Date *</label>
                  <input className="input" type="date" value={form.date}
                    onChange={e => set('date', e.target.value)} required />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Category *</label>
                <select className="select" value={form.category} onChange={e => set('category', e.target.value)} required>
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="textarea" placeholder="Provide more details about this expense..."
                  value={form.description} onChange={e => set('description', e.target.value)} />
              </div>

              <div className="input-group">
                <label className="input-label">Tags (comma separated)</label>
                <input className="input" placeholder="client-meeting, q4, marketing" value={form.tags}
                  onChange={e => set('tags', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <h3 className="card-title">Expense Lines</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>+ Add Line</button>
            </div>
            {form.expenseLines.length === 0 ? (
              <p className="text-muted text-sm">No expense lines added. Click "Add Line" to itemize.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {form.expenseLines.map((line, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px auto', gap: 8, alignItems: 'center' }}>
                    <input className="input" placeholder="Description" value={line.description}
                      onChange={e => updateLine(i, 'description', e.target.value)} />
                    <select className="select" value={line.category}
                      onChange={e => updateLine(i, 'category', e.target.value)}>
                      <option value="">Category</option>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <input className="input" type="number" placeholder="Amount" value={line.amount}
                      onChange={e => updateLine(i, 'amount', e.target.value)} />
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeLine(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="expense-form-side">
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>Receipt</h3>

            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${form.receipt ? 'has-file' : ''}`}>
              <input {...getInputProps()} />
              {uploadingReceipt ? (
                <div style={{ textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto 8px' }} />
                  <p className="text-sm text-muted">Scanning receipt with OCR...</p>
                </div>
              ) : form.receipt ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
                  <p style={{ fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>Receipt uploaded!</p>
                  <p className="text-sm text-muted">{form.receipt.filename}</p>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={e => { e.stopPropagation(); set('receipt', null); }}>Remove</button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
                  <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                    {isDragActive ? 'Drop receipt here' : 'Upload receipt'}
                  </p>
                  <p className="text-sm text-muted">Drag & drop or click to browse</p>
                  <p className="text-sm text-muted" style={{ marginTop: 4 }}>OCR auto-fills fields</p>
                </div>
              )}
            </div>

            {ocrDetected && (
              <div className="alert alert-info" style={{ marginTop: 12 }}>
                <span>🤖</span>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>OCR Detected</div>
                  {ocrDetected.vendor && <div className="text-sm">Vendor: {ocrDetected.vendor}</div>}
                  {ocrDetected.amount && <div className="text-sm">Amount: {ocrDetected.amount}</div>}
                  {ocrDetected.date && <div className="text-sm">Date: {ocrDetected.date}</div>}
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="card-title" style={{ marginBottom: 12 }}>Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span className="text-muted">Amount</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>
                  {form.currency.symbol}{parseFloat(form.amount || 0).toFixed(2)} {form.currency.code}
                </span>
              </div>
              {convertedAmount != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span className="text-muted">In {companyCurrency?.code}</span>
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                    {companyCurrency?.symbol}{convertedAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="divider" style={{ margin: '4px 0' }} />
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? <><span className="spinner" /> Submitting...</> : '🚀 Submit Expense'}
              </button>
              <button type="button" className="btn btn-secondary" style={{ width: '100%' }}
                onClick={() => navigate(-1)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SubmitExpense;
