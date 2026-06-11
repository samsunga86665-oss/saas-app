// src/pages/SuperownerPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCompanies, createCompany, toggleCompanyBlock, initSuperowner, createUser, deleteCompany } from '../firebase/db';
import { Modal, useToast, Confirm, ColorPicker, EmptyState, Spinner } from '../components/shared/UI';
import { Building2, Plus, Users, ShoppingCart, Lock, Unlock, LogIn, Moon, Sun, LogOut, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const BUSINESS_TYPES = [
  { key: 'shop',        emoji: '🏪', label: "Do'kon",           color: '#6366f1' },
  { key: 'restaurant',  emoji: '🍕', label: 'Restoran / Kafe',  color: '#f59e0b' },
  { key: 'pharmacy',    emoji: '💊', label: 'Dorixona',         color: '#10b981' },
  { key: 'construction',emoji: '🏗️', label: 'Qurilish',        color: '#78716c' },
  { key: 'beauty',      emoji: '💇', label: "Go'zallik saloni", color: '#ec4899' },
  { key: 'logistics',   emoji: '📦', label: 'Logistika / Ombor',color: '#0ea5e9' },
  { key: 'clinic',      emoji: '🏥', label: 'Klinika',          color: '#14b8a6' },
  { key: 'education',   emoji: '🎓', label: "Ta'lim markazi",   color: '#8b5cf6' },
  { key: 'auto',        emoji: '🚗', label: 'Avto servis',      color: '#f97316' },
  { key: 'clothing',    emoji: '👗', label: "Kiyim do'koni",    color: '#e879f9' },
  { key: 'it',          emoji: '💻', label: 'IT kompaniya',     color: '#3b82f6' },
  { key: 'finance',     emoji: '🏦', label: 'Moliya / Bank',    color: '#22c55e' },
  { key: 'other',       emoji: '🏢', label: 'Boshqa...',        color: '#6366f1' },
];

function getBusinessInfo(type, customName) {
  if (type === 'other' && customName) {
    const colors = ['#6366f1','#f59e0b','#10b981','#ec4899','#0ea5e9','#8b5cf6','#f97316'];
    return { emoji: customName[0]?.toUpperCase() || '🏢', label: customName, color: colors[customName.charCodeAt(0) % colors.length] };
  }
  return BUSINESS_TYPES.find(b => b.key === type) || BUSINESS_TYPES[0];
}

const EMPTY_FORM = { name: '', code: '', color: '#6366f1', phone: '', businessType: '', customBusiness: '', ownerPhone: '', ownerPassword: '', ownerName: '' };

export default function SuperownerPage() {
  const { user, impersonateCompany, logout } = useAuth();
  const { darkMode, toggleDark } = useTheme();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const nav = useNavigate();

  useEffect(() => {
    initSuperowner();
    const unsub = getCompanies((data) => { setCompanies(data); setLoading(false); });
    return unsub;
  }, []);

  const selectBusinessType = (type) => {
    const info = BUSINESS_TYPES.find(b => b.key === type);
    setForm(f => ({ ...f, businessType: type, color: info?.color || f.color, customBusiness: type === 'other' ? f.customBusiness : '' }));
  };

  const activeBusinessInfo = form.businessType ? getBusinessInfo(form.businessType, form.customBusiness) : null;

  const handleCreate = async () => {
    if (!form.name || !form.code) return toast('Nom va kodni kiriting', 'error');
    if (!form.businessType) return toast('Biznes turini tanlang', 'error');
    if (form.businessType === 'other' && !form.customBusiness) return toast('Biznes nomini kiriting', 'error');
    if (!form.ownerPhone || !form.ownerPassword) return toast('Owner telefon va parolini kiriting', 'error');
    const exists = companies.find(c => c.settings?.companyCode === form.code);
    if (exists) return toast('Bu kod allaqachon mavjud', 'error');
    setSaving(true);
    try {
      const bInfo = getBusinessInfo(form.businessType, form.customBusiness);
      const companyId = await createCompany({ ...form, businessEmoji: bInfo.emoji, businessLabel: bInfo.label, color: form.color || bInfo.color });
      await createUser(companyId, { name: form.ownerName || 'Owner', phone: form.ownerPhone, password: form.ownerPassword, role: 'owner', active: true });
      toast(`${form.name} yaratildi!`, 'success');
      setShowCreate(false);
      setForm(EMPTY_FORM);
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleToggleBlock = async () => {
    const { id, blocked } = confirmBlock;
    try {
      await toggleCompanyBlock(id, !blocked);
      toast(!blocked ? 'Bloklandi' : 'Ochildi', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setConfirmBlock(null);
  };

  const handleDelete = async () => {
    try {
      await deleteCompany(confirmDelete.id);
      toast(`${confirmDelete.name} o'chirildi`, 'success');
    } catch (e) { toast(e.message, 'error'); }
    setConfirmDelete(null);
  };

  const handleImpersonate = (company) => { impersonateCompany(company); nav('/dashboard'); };

  const totalOrders = companies.reduce((s, c) => s + Object.keys(c.orders || {}).length, 0);
  const totalClients = companies.reduce((s, c) => s + Object.keys(c.clients || {}).length, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>Superowner Panel</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Salom, {user?.name}!</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-icon" onClick={toggleDark} style={{ border: 'none' }}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); nav('/login'); }}><LogOut size={14} /> Chiqish</button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { icon: Building2, label: 'Jami kompaniyalar', value: companies.length, color: '#6366f1' },
            { icon: ShoppingCart, label: 'Jami buyurtmalar', value: totalOrders, color: '#10b981' },
            { icon: Users, label: 'Jami hamkorlar', value: totalClients, color: '#f59e0b' },
            { icon: Lock, label: 'Bloklangan', value: companies.filter(c => c.settings?.blocked).length, color: '#ef4444' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}><s.icon size={22} /></div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Barcha kompaniyalar</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{companies.length} ta kompaniya</div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Yangi kompaniya</button>
          </div>

          {loading ? <Spinner center /> : companies.length === 0 ? (
            <EmptyState icon={Building2} title="Kompaniyalar yo'q" action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Yaratish</button>} />
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr><th>Kompaniya</th><th>Biznes turi</th><th>Kod</th><th>Buyurtmalar</th><th>Holat</th><th>Amallar</th></tr>
                </thead>
                <tbody>
                  {companies.map(comp => {
                    const s = comp.settings || {};
                    return (
                      <tr key={comp.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.primaryColor || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                              {s.logo ? <img src={s.logo} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} /> : (s.businessEmoji || '🏢')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{s.name}</div>
                              {s.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.phone}</div>}
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-blue">{s.businessEmoji} {s.businessLabel || 'Kompaniya'}</span></td>
                        <td><span className="badge badge-gray" style={{ fontFamily: 'monospace' }}>{s.companyCode}</span></td>
                        <td>{Object.keys(comp.orders || {}).length}</td>
                        <td><span className={`badge ${s.blocked ? 'badge-red' : 'badge-green'}`}>{s.blocked ? '🔒 Bloklangan' : '✅ Faol'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleImpersonate(comp)}><LogIn size={14} /> Kirish</button>
                            <button className={`btn btn-sm ${s.blocked ? 'btn-success' : 'btn-ghost'}`}
                              style={!s.blocked ? { color: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
                              onClick={() => setConfirmBlock({ id: comp.id, name: s.name, blocked: s.blocked })}>
                              {s.blocked ? <Unlock size={14} /> : <Lock size={14} />}
                              {s.blocked ? 'Ochish' : 'Bloklash'}
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete({ id: comp.id, name: s.name })}>
                              <Trash2 size={14} />
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

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Yangi kompaniya qo'shish" maxWidth={560}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Bekor</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Plus size={14} />} Yaratish
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Biznes turi *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {BUSINESS_TYPES.map(bt => (
              <button key={bt.key} onClick={() => selectBusinessType(bt.key)}
                style={{
                  padding: '10px 8px', borderRadius: 10, border: '2px solid',
                  borderColor: form.businessType === bt.key ? bt.color : 'var(--border)',
                  background: form.businessType === bt.key ? `${bt.color}15` : 'var(--bg)',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s'
                }}>
                <div style={{ fontSize: 22 }}>{bt.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: form.businessType === bt.key ? bt.color : 'var(--text-muted)', marginTop: 4 }}>{bt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {form.businessType === 'other' && (
          <div className="form-group">
            <label className="form-label">Biznes nomini yozing *</label>
            <input className="form-input" placeholder="Masalan: Quruq tozalash, Mehmonxona..."
              value={form.customBusiness}
              onChange={e => {
                const val = e.target.value;
                const colors = ['#6366f1','#f59e0b','#10b981','#ec4899','#0ea5e9','#8b5cf6','#f97316'];
                setForm(f => ({ ...f, customBusiness: val, color: val ? colors[val.charCodeAt(0) % colors.length] : '#6366f1' }));
              }} />
          </div>
        )}

        {form.businessType && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: `${activeBusinessInfo?.color || form.color}15`, border: `1px solid ${activeBusinessInfo?.color || form.color}40`, marginBottom: 4 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, fontSize: 24, background: activeBusinessInfo?.color || form.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeBusinessInfo?.emoji}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{form.name || 'Kompaniya nomi'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{form.businessType === 'other' ? form.customBusiness || '...' : activeBusinessInfo?.label}</div>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Kompaniya nomi *</label>
          <input className="form-input" placeholder="Masalan: MSMUZ Savdo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Kompaniya kodi *</label>
            <input className="form-input" placeholder="MSMUZ" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Telefon</label>
            <input className="form-input" placeholder="998..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Rang</label>
          <ColorPicker value={form.color} onChange={c => setForm(f => ({ ...f, color: c }))} />
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>👤 Owner (egasi) ma'lumotlari</div>
          <div className="form-group">
            <label className="form-label">Owner ismi</label>
            <input className="form-input" placeholder="To'liq ism" value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Telefon *</label>
              <input className="form-input" placeholder="998..." value={form.ownerPhone} onChange={e => setForm(f => ({ ...f, ownerPhone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Parol *</label>
              <input className="form-input" type="text" placeholder="Parol" value={form.ownerPassword} onChange={e => setForm(f => ({ ...f, ownerPassword: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>

      <Confirm open={!!confirmBlock} onCancel={() => setConfirmBlock(null)} onConfirm={handleToggleBlock}
        title={confirmBlock?.blocked ? 'Kompaniyani ochish' : 'Kompaniyani bloklash'}
        message={`${confirmBlock?.name} kompaniyasini ${confirmBlock?.blocked ? 'ochmoqchimisiz' : 'bloklashni xohlaysizmi'}?`}
        danger={!confirmBlock?.blocked} />

      <Confirm open={!!confirmDelete} onCancel={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Kompaniyani o'chirish"
        message={`${confirmDelete?.name} kompaniyasini butunlay o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi!`}
        danger />
    </div>
  );
}
