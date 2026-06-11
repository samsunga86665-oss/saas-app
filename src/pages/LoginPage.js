// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/shared/UI';
import { Eye, EyeOff, Building2, Shield } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState('company'); // 'company' | 'superowner'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginSuperowner, loginCompanyUser } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) return toast('Barcha maydonlarni to\'ldiring', 'error');
    if (mode === 'company' && !companyCode) return toast('Kompaniya kodini kiriting', 'error');
    setLoading(true);
    try {
      if (mode === 'superowner') {
        await loginSuperowner(phone, password);
        nav('/superowner');
      } else {
        await loginCompanyUser(phone, password, companyCode);
        nav('/dashboard');
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'var(--primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px var(--primary-light)'
          }}>
            <Building2 size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>SaaS Platform</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Tizimga kirish uchun ma'lumotlaringizni kiriting
          </p>
        </div>

        {/* Mode switcher */}
        <div style={{
          display: 'flex', gap: 4, padding: 4,
          background: 'var(--hover)', borderRadius: 10,
          marginBottom: 24
        }}>
          {[
            { key: 'company', label: '🏢 Kompaniya', icon: Building2 },
            { key: 'superowner', label: '🛡️ Superowner', icon: Shield }
          ].map(m => (
            <button key={m.key} className={`btn ${mode === m.key ? 'btn-primary' : ''}`}
              style={{
                flex: 1, justifyContent: 'center',
                background: mode === m.key ? 'var(--primary)' : 'transparent',
                color: mode === m.key ? '#fff' : 'var(--text-muted)',
                border: 'none', borderRadius: 7
              }}
              onClick={() => setMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'company' && (
              <div className="form-group">
                <label className="form-label">Kompaniya kodi</label>
                <input
                  className="form-input"
                  placeholder="Masalan: MSMUZ, ACME..."
                  value={companyCode}
                  onChange={e => setCompanyCode(e.target.value.toUpperCase())}
                  autoFocus
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Telefon raqam</label>
              <input
                className="form-input"
                placeholder="998901234567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                type="tel"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Parol</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Parolingiz"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 4 }}>
              {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : 'Kirish'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 16 }}>
          © 2024 SaaS Platform. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
}
