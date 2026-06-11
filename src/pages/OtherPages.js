// src/pages/OtherPages.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast, Modal, EmptyState, SearchInput, Spinner, ColorPicker } from '../components/shared/UI';
import { updateCompanySettings, getOrders, getClients, getExpenses, createExpense, getProducts, getSklad, updateSkladItem } from '../firebase/db';
import { Plus, Save, Building2, Palette, DollarSign, Warehouse, AlertTriangle, BarChart3, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { activeCompany } = useAuth();
  const s = activeCompany?.settings || {};
  const [form, setForm] = useState({ name: s.name || '', phone: s.phone || '', primaryColor: s.primaryColor || '#6366f1', logo: s.logo || '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCompanySettings(activeCompany.id, form);
      toast('Sozlamalar saqlandi!', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Sozlamalar</div>
          <div className="page-subtitle">Kompaniya ma'lumotlarini boshqarish</div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Save size={16} />}
          Saqlash
        </button>
      </div>

      <div style={{ maxWidth: 600 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontWeight: 700 }}>
            <Building2 size={18} color="var(--primary)" /> Kompaniya ma'lumotlari
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Kompaniya nomi</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Telefon raqam</label>
              <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Logo URL (ixtiyoriy)</label>
              <input className="form-input" value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontWeight: 700 }}>
            <Palette size={18} color="var(--primary)" /> Dizayn va rang
          </div>
          <div className="form-group">
            <label className="form-label">Asosiy rang</label>
            <ColorPicker value={form.primaryColor} onChange={c => setForm(f => ({ ...f, primaryColor: c }))} />
          </div>
          <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: form.primaryColor, color: '#fff' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{form.name || 'Kompaniya nomi'}</div>
            <div style={{ opacity: 0.85, fontSize: 13 }}>Ko'rinish namunasi</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
export function ReportsPage() {
  const { activeCompany } = useAuth();
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    if (!activeCompany?.id) return;
    const u1 = getOrders(activeCompany.id, d => { setOrders(d); setLoading(false); });
    const u2 = getExpenses(activeCompany.id, setExpenses);
    return () => { u1(); u2(); };
  }, [activeCompany?.id]);

  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  const chartData = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const date = subDays(new Date(), Math.min(days, 30) - 1 - i);
    const start = startOfDay(date).getTime();
    const end = start + 86400000;
    const dayOrders = orders.filter(o => o.createdAt >= start && o.createdAt < end && o.status === 'completed');
    const dayExp = expenses.filter(e => e.createdAt >= start && e.createdAt < end);
    return {
      date: format(date, 'dd/MM'),
      daromad: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
      xarajat: dayExp.reduce((s, e) => s + (e.amount || 0), 0),
    };
  });

  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const profit = totalRevenue - totalExpenses;

  const statusData = ['new', 'processing', 'completed', 'cancelled'].map(st => ({
    name: st === 'new' ? 'Yangi' : st === 'processing' ? 'Jarayonda' : st === 'completed' ? 'Tugallangan' : 'Bekor',
    value: orders.filter(o => o.status === st).length
  })).filter(d => d.value > 0);
  const PIE_COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ef4444'];

  if (loading) return <Spinner center />;

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Hisobot</div></div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['week', 'Hafta'], ['month', 'Oy'], ['quarter', 'Chorak']].map(([k, l]) => (
            <button key={k} className={`btn ${period === k ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setPeriod(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { icon: TrendingUp, label: 'Umumiy daromad', value: `${totalRevenue.toLocaleString()} so'm`, color: '#10b981' },
          { icon: TrendingDown, label: 'Umumiy xarajat', value: `${totalExpenses.toLocaleString()} so'm`, color: '#ef4444' },
          { icon: BarChart3, label: 'Foyda', value: `${profit.toLocaleString()} so'm`, color: profit >= 0 ? '#10b981' : '#ef4444' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}><s.icon size={22} /></div>
            <div className="stat-value" style={{ fontSize: 18 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Daromad va xarajat</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="daromad" fill="#10b981" radius={[4, 4, 0, 0]} name="Daromad" />
              <Bar dataKey="xarajat" fill="#ef4444" radius={[4, 4, 0, 0]} name="Xarajat" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Buyurtmalar holati</div>
          {statusData.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: 'var(--text-muted)' }}>Ma'lumot yo'q</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
export function ExpensesPage() {
  const { activeCompany } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', amount: 0, category: 'other', note: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!activeCompany?.id) return;
    const unsub = getExpenses(activeCompany.id, d => { setExpenses(d); setLoading(false); });
    return unsub;
  }, [activeCompany?.id]);

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const handleSave = async () => {
    if (!form.title || !form.amount) return toast('Maydonlarni to\'ldiring', 'error');
    setSaving(true);
    try {
      await createExpense(activeCompany.id, form);
      toast('Xarajat qo\'shildi', 'success');
      setShowForm(false);
      setForm({ title: '', amount: 0, category: 'other', note: '' });
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const CATEGORIES = { ish_haqi: 'Ish haqi', ijara: 'Ijara', kommunal: 'Kommunal', transport: 'Transport', mahsulot: 'Mahsulot', reklama: 'Reklama', other: 'Boshqa' };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Xarajatlar</div>
          <div className="page-subtitle">Jami: {total.toLocaleString()} so'm</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Yangi xarajat</button>
      </div>

      {loading ? <Spinner center /> : expenses.length === 0 ? (
        <EmptyState icon={DollarSign} title="Xarajatlar yo'q"
          action={<button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Qo'shish</button>} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Sarlavha</th><th>Kategoriya</th><th>Summa</th><th>Sana</th><th>Izoh</th></tr></thead>
            <tbody>
              {[...expenses].sort((a, b) => b.createdAt - a.createdAt).map(e => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 600 }}>{e.title}</td>
                  <td><span className="badge badge-yellow">{CATEGORIES[e.category] || e.category}</span></td>
                  <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{(e.amount || 0).toLocaleString()} so'm</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{e.createdAt ? format(new Date(e.createdAt), 'dd.MM.yyyy HH:mm') : '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{e.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Yangi xarajat"
        footer={<><button className="btn btn-ghost" onClick={() => setShowForm(false)}>Bekor</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>Saqlash</button></>}
      >
        <div className="form-group"><label className="form-label">Sarlavha *</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
        <div className="form-group">
          <label className="form-label">Kategoriya</label>
          <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Summa (so'm) *</label><input className="form-input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))} min={0} /></div>
        <div className="form-group"><label className="form-label">Izoh</label><textarea className="form-input" rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></div>
      </Modal>
    </div>
  );
}

// ─── SKLAD ────────────────────────────────────────────────────────────────────
export function SkladPage() {
  const { activeCompany } = useAuth();
  const [products, setProducts] = useState([]);
  const [sklad, setSklad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (!activeCompany?.id) return;
    const u1 = getProducts(activeCompany.id, setProducts);
    const u2 = getSklad(activeCompany.id, d => { setSklad(d); setLoading(false); });
    return () => { u1(); u2(); };
  }, [activeCompany?.id]);

  const getStock = (pid) => sklad.find(s => s.id === pid)?.quantity || 0;

  const items = products
    .filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()))
    .map(p => ({ ...p, stock: getStock(p.id) }))
    .sort((a, b) => a.stock - b.stock);

  const lowStock = items.filter(p => p.stock <= 5);

  const handleUpdate = async (pid, qty) => {
    try {
      await updateSkladItem(activeCompany.id, pid, Math.max(0, qty));
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Sklad</div>
          <div className="page-subtitle">{products.length} tur mahsulot {lowStock.length > 0 && `· ⚠️ ${lowStock.length} ta kam`}</div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#d97706' }}>
          <AlertTriangle size={18} />
          <span style={{ fontWeight: 600 }}>Kam qolgan:</span>
          {lowStock.map(p => p.name).join(', ')}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Mahsulot qidirish..." />
      </div>

      {loading ? <Spinner center /> : items.length === 0 ? (
        <EmptyState icon={Warehouse} title="Mahsulotlar yo'q" desc="Avval mahsulotlar qo'shing" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mahsulot</th><th>Kategoriya</th><th>Birlik</th><th>Narx</th><th>Miqdor</th><th>Holat</th></tr></thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.category ? <span className="badge badge-blue">{p.category}</span> : '—'}</td>
                  <td>{p.unit}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{(p.price || 0).toLocaleString()} so'm</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button className="btn-icon" style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => handleUpdate(p.id, p.stock - 1)}>−</button>
                      <input type="number" value={p.stock} min={0}
                        onChange={e => handleUpdate(p.id, +e.target.value)}
                        className="form-input" style={{ width: 80, textAlign: 'center', padding: '4px 8px' }} />
                      <button className="btn-icon" style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => handleUpdate(p.id, p.stock + 1)}>+</button>
                    </div>
                  </td>
                  <td>
                    {p.stock === 0 ? <span className="badge badge-red">Tugagan</span>
                      : p.stock <= 5 ? <span className="badge badge-yellow">⚠️ Kam</span>
                      : <span className="badge badge-green">Yetarli</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
export function CalendarPage() {
  const { activeCompany } = useAuth();
  const [orders, setOrders] = useState([]);
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

  useEffect(() => {
    if (!activeCompany?.id) return;
    return getOrders(activeCompany.id, setOrders);
  }, [activeCompany?.id]);

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  const startPad = startOfMonth(current).getDay();

  const getDayOrders = (day) => orders.filter(o => o.createdAt && isSameDay(new Date(o.createdAt), day));
  const selectedOrders = getDayOrders(selected);

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Kalendar</div></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-icon" onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1))}><ChevronLeft size={16} /></button>
          <span style={{ fontWeight: 700, minWidth: 140, textAlign: 'center' }}>{format(current, 'MMMM yyyy')}</span>
          <button className="btn-icon" onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1))}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
            {['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'].map(d => (
              <div key={d} style={{ padding: '12px 4px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{d}</div>
            ))}
            {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} style={{ padding: 10 }} />)}
            {days.map(day => {
              const dayOrds = getDayOrders(day);
              const isSelected = isSameDay(day, selected);
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} onClick={() => setSelected(day)}
                  style={{
                    padding: '10px 4px', cursor: 'pointer', textAlign: 'center', position: 'relative',
                    background: isSelected ? 'var(--primary)' : 'transparent',
                    color: isSelected ? '#fff' : isToday ? 'var(--primary)' : 'var(--text)',
                    fontWeight: isToday || isSelected ? 700 : 400,
                    borderRadius: 4, margin: 2
                  }}>
                  {day.getDate()}
                  {dayOrds.length > 0 && (
                    <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: isSelected ? '#fff' : 'var(--primary)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>
            {format(selected, 'dd.MM.yyyy')} — {selectedOrders.length} ta buyurtma
          </div>
          {selectedOrders.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>Bu kunda buyurtma yo'q</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedOrders.map(o => (
                <div key={o.id} style={{ padding: '12px', background: 'var(--hover)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{o.clientName || 'Hamkor yo\'q'}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{o.createdAt ? format(new Date(o.createdAt), 'HH:mm') : ''}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--success)' }}>{(o.total || 0).toLocaleString()} so'm</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
