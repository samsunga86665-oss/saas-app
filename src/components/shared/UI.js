// src/components/shared/UI.js
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

// ─── MODAL ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, footer, maxWidth = 500 }) => {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth }}>
        {title && (
          <div className="modal-header">
            <span className="modal-title">{title}</span>
            <button className="btn-icon" onClick={onClose} style={{ border: 'none' }}>
              <X size={18} />
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const icons = { success: <CheckCircle size={18} color="var(--success)" />, error: <AlertCircle size={18} color="var(--danger)" />, info: <Info size={18} color="var(--primary)" /> };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {icons[t.type]}
            <span>{t.msg}</span>
            <button className="btn-icon" style={{ marginLeft: 'auto', border: 'none', padding: 4 }} onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

// ─── SPINNER ─────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 24, center = false }) => (
  <div style={center ? { display: 'flex', justifyContent: 'center', padding: '40px 0' } : {}}>
    <div className="spinner" style={{ width: size, height: size }} />
  </div>
);

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
export const Confirm = ({ open, onConfirm, onCancel, title, message, danger }) => (
  <Modal open={open} onClose={onCancel} title={title || 'Tasdiqlang'}
    footer={
      <>
        <button className="btn btn-ghost" onClick={onCancel}>Bekor</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>Ha, davom</button>
      </>
    }
  >
    <p style={{ color: 'var(--text-muted)' }}>{message || 'Davom etishni xohlaysizmi?'}</p>
  </Modal>
);

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, desc, action }) => (
  <div className="empty-state">
    {Icon && <Icon size={52} />}
    <h3>{title}</h3>
    {desc && <p style={{ fontSize: 13, marginBottom: 16 }}>{desc}</p>}
    {action}
  </div>
);

// ─── COLOR PICKER ─────────────────────────────────────────────────────────────
const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#06b6d4','#3b82f6','#14b8a6','#84cc16'];
export const ColorPicker = ({ value, onChange }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {COLORS.map(c => (
      <button key={c} onClick={() => onChange(c)} style={{
        width: 32, height: 32, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
        outline: value === c ? `3px solid ${c}` : '3px solid transparent',
        outlineOffset: 2, transition: 'transform 0.15s'
      }} />
    ))}
    <input type="color" value={value} onChange={e => onChange(e.target.value)}
      style={{ width: 32, height: 32, padding: 0, border: 'none', cursor: 'pointer', borderRadius: '50%', background: 'transparent' }} />
  </div>
);

// ─── SEARCH INPUT ─────────────────────────────────────────────────────────────
import { Search } from 'lucide-react';
export const SearchInput = ({ value, onChange, placeholder = 'Qidirish...' }) => (
  <div className="search-input-wrap">
    <Search size={16} className="search-icon" />
    <input className="form-input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: `rgba(${hexToRgb(color || 'var(--primary-rgb)')},0.12)`, color: color || 'var(--primary)' }}>
      <Icon size={22} />
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
  </div>
);

function hexToRgb(hex) {
  if (hex?.startsWith('var(')) return '99,102,241';
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '99,102,241';
}
