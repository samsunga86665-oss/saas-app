// src/pages/SuperownerPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCompanies, createCompany, toggleCompanyBlock, initSuperowner, createUser } from '../firebase/db';
import { Modal, useToast, Confirm, ColorPicker, EmptyState, Spinner } from '../components/shared/UI';
import {
  Building2, Plus, Users, ShoppingCart, BarChart3,
  Lock, Unlock, LogIn, Moon, Sun, LogOut, Settings, Warehouse
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function SuperownerPage() {
  const { user, impersonateCompany, logout } = useAuth();
  const { darkMode, toggleDark } = useTheme();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', color: '#6366f1', phone: '', ownerPhone: '', ownerPassword: '', ownerName: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const nav = useNavigate();

  useEffect(() => {
    initSuperowner();
    const unsub = getCompanies((data) => {
      setCompanies(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.code) return toast('Nom va kodni kiriting', 'error');
    if (!form.ownerPhone || !form.ownerPassword) return toast('Owner telefon va parolini kiriting', 'error');
    const exists = companies.find(c => c.settings?.companyCode === form.code);
    if (exists) return toast('Bu kod allaqachon mavjud', 'error');
    setSaving(true);
    try {
      const companyId = await createCompany(form);
      await createUser(companyId, {
        name: form.ownerName || 'Owner',
        phone: form.ownerPhone,
        password: form.ownerPassword,
        role: 'owner',
        active: true,
      });
      toast(`${form.name} yaratildi! Owner: ${form.ownerPhone} / ${form.ownerPassword}`, 'success');
      setShowCreate(false);
      setForm({ name: '', code: '', color: '#6366f1', phone: '', ownerPhone: '', ownerPassword: '', ownerName: '' });
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async () => {
    const { id, blocked } = confirmBlock;
    try {
      await toggleCompanyBlock(id, !blocked);
      toast(!blocked ? 'Kompaniya bloklandi' : 'Kompaniya ochildi', 'success');
    } catch (e) {
      toast(e.message, 'error');
    }
    setConfirmBlock(null);
  };

  const handleImpersonate = (company) => {
    impersonateCompany(company);
    nav('/dashboard');
  };

  const totalOrders = companies.reduce((s, c) => s + Object.keys(c.orders || {}).length, 0);
  const totalClients = companies.reduce((s, c) => s + Object.keys(c.clients || {}).length, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Building2 size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>Superowner Panel</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Salom, {user?.name}!</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-icon" onClick={toggleDark} style={{ border: 'none' }}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); nav('/login'); }}>
            <LogOut size={14} /> Chiqish
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { icon: Building2, label: 'Jami kompaniyalar', value: companies.length, color: '#6366f1' },
            { icon: ShoppingCart, label: 'Jami buyurtmalar', value: totalOrders, color: '#10b981' },
            { icon: Users, label: 'Jami hamkorlar', value: totalClients, color: '#f59e0b' },
            { icon: Lock, label: 'Bloklangan', value: companies.filter(c => c.settings?.blocked).length, color: '#ef4444' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>
                <s.icon size={22} />
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Companies list */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Barcha kompaniyalar</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{companies.length} ta kompaniya</div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Yangi kompaniya
            </button>
          </div>

          {loading ? <Spinner center /> : companies.length === 0 ? (
            <EmptyState icon={Building2} title="Kompaniyalar yo'q" desc="Birinchi kompaniyani yarating" action={
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Yaratish</button>
            } />
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Kompaniya</th>
                    <th>Kod</th>
                    <th>Buyurtmalar</th>
                    <th>Hamkorlar</th>
                    <th>Holat</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(comp => {
                    const s = comp.settings || {};
                    const ordersCount = Object.keys(comp.orders || {}).length;
                    const clientsCount = Object.keys(comp.clients || {}).length;
                    return (
                      <tr key={comp.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 8, background: s.primaryColor || '#6366f1',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontWeight: 700, flexShrink: 0
                            }}>
                              {s.logo ? <img src={s.logo} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                                : s.name?.[0] || 'C'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{s.name}</div>
                              {s.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.phone}</div>}
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-blue">{s.companyCode}</span></td>
                        <td>{ordersCount}</td>
                        <td>{clientsCount}</td>
                        <td>
                          <span className={`badge ${s.blocked ? 'badge-red' : 'badge-green'}`}>
                            {s.blocked ? '🔒 Bloklangan' : '✅ Faol'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleImpersonate(comp)}
                              title="Kirish">
                              <LogIn size={14} /> Kirish
                            </button>
                            <button
                              className={`btn btn-sm ${s.blocked ? 'btn-success' : 'btn-ghost'}`}
                              style={!s.blocked ? { color: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
                              onClick={() => setConfirmBlock({ id: comp.id, name: s.name, blocked: s.blocked })}
                            >
                              {s.blocked ? <Unlock size={14} /> : <Lock size={14} />}
                              {s.blocked ? 'Ochish' : 'Bloklash'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Company Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Yangi kompaniya qo'shish"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Bekor</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Plus size={14} />}
              Yaratish
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Kompaniya nomi *</label>
          <input className="form-input" placeholder="Masalan: MSMUZ" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Kompaniya kodi * (login uchun)</label>
          <input className="form-input" placeholder="MSMUZ" value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Telefon raqam</label>
          <input className="form-input" placeholder="998901234567" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Asosiy rang</label>
          <ColorPicker value={form.color} onChange={c => setForm(f => ({ ...f, color: c }))} />
          <div style={{
            marginTop: 8, padding: '10px 14px', borderRadius: 8,
            background: form.color, color: '#fff', fontSize: 13, fontWeight: 600
          }}>
            Ko'rinish: {form.name || 'Kompaniya nomi'}
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>👤 Owner (egasi) ma'lumotlari</div>
          <div className="form-group">
            <label className="form-label">Owner ismi</label>
            <input className="form-input" placeholder="To'liq ism" value={form.ownerName}
              onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Owner telefon * (login uchun)</label>
            <input className="form-input" placeholder="998901234567" value={form.ownerPhone}
              onChange={e => setForm(f => ({ ...f, ownerPhone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Owner paroli *</label>
            <input className="form-input" type="text" placeholder="Kamida 6 ta belgi" value={form.ownerPassword}
              onChange={e => setForm(f => ({ ...f, ownerPassword: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Block Confirm */}
      <Confirm
        open={!!confirmBlock}
        onCancel={() => setConfirmBlock(null)}
        onConfirm={handleToggleBlock}
        title={confirmBlock?.blocked ? 'Kompaniyani ochish' : 'Kompaniyani bloklash'}
        message={`${confirmBlock?.name} kompaniyasini ${confirmBlock?.blocked ? 'ochmoqchimisiz' : 'bloklashni xohlaysizmi'}?`}
        danger={!confirmBlock?.blocked}
      />
    </div>
  );
}
