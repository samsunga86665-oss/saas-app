// src/pages/ClientsPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getClients, createClient, updateClient, deleteClient } from '../firebase/db';
import { Modal, useToast, Confirm, EmptyState, SearchInput, Spinner } from '../components/shared/UI';
import { Plus, Edit2, Trash2, Users, Phone, MapPin, CreditCard } from 'lucide-react';

const EMPTY_FORM = { name: '', phone: '', address: '', note: '', debt: 0 };

export default function ClientsPage() {
  const { activeCompany } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [debtFilter, setDebtFilter] = useState('all');
  const toast = useToast();

  useEffect(() => {
    if (!activeCompany?.id) return;
    const unsub = getClients(activeCompany.id, d => { setClients(d); setLoading(false); });
    return unsub;
  }, [activeCompany?.id]);

  const filtered = clients
    .filter(c => debtFilter === 'all' || (debtFilter === 'debt' && c.debt > 0) || (debtFilter === 'clean' && !c.debt))
    .filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));

  const totalDebt = clients.reduce((s, c) => s + (c.debt || 0), 0);

  const handleSave = async () => {
    if (!form.name) return toast('Ismni kiriting', 'error');
    setSaving(true);
    try {
      if (editId) {
        await updateClient(activeCompany.id, editId, form);
        toast('Hamkor yangilandi', 'success');
      } else {
        await createClient(activeCompany.id, form);
        toast('Hamkor qo\'shildi!', 'success');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleEdit = (c) => {
    setForm({ name: c.name || '', phone: c.phone || '', address: c.address || '', note: c.note || '', debt: c.debt || 0 });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteClient(activeCompany.id, confirmDel);
      toast('Hamkor o\'chirildi', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setConfirmDel(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Hamkorlar</div>
          <div className="page-subtitle">{clients.length} ta hamkor · Jami nasiya: {totalDebt.toLocaleString()} so'm</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}>
          <Plus size={16} /> Yangi hamkor
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Ism yoki telefon..." />
        </div>
        {[['all', 'Barchasi'], ['debt', '💰 Nasiyalilar'], ['clean', '✅ Toza']].map(([k, l]) => (
          <button key={k} className={`btn ${debtFilter === k ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setDebtFilter(k)}>{l}</button>
        ))}
      </div>

      {loading ? <Spinner center /> : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Hamkorlar yo'q" desc="Birinchi hamkorni qo'shing"
          action={<button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Qo'shish</button>} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Ism</th>
                <th>Telefon</th>
                <th>Manzil</th>
                <th>Nasiya</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'var(--primary-light)', color: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, flexShrink: 0
                      }}>{c.name?.[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        {c.note && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.note}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                        <Phone size={14} color="var(--text-muted)" /> {c.phone}
                      </a>
                    ) : '—'}
                  </td>
                  <td>
                    {c.address ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                        <MapPin size={14} color="var(--text-muted)" /> {c.address}
                      </div>
                    ) : '—'}
                  </td>
                  <td>
                    {c.debt > 0 ? (
                      <span className="badge badge-red">
                        <CreditCard size={12} style={{ marginRight: 4 }} />
                        {c.debt.toLocaleString()} so'm
                      </span>
                    ) : (
                      <span className="badge badge-green">Toza</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" onClick={() => handleEdit(c)}><Edit2 size={14} /></button>
                      <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDel(c.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Hamkorni tahrirlash' : 'Yangi hamkor'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Bekor</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <div className="spinner" style={{ width: 16, height: 16 }} /> : null} Saqlash
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Ism *</label>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Hamkor ismi" />
        </div>
        <div className="form-group">
          <label className="form-label">Telefon</label>
          <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="998..." type="tel" />
        </div>
        <div className="form-group">
          <label className="form-label">Manzil</label>
          <input className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Shahar, ko'cha..." />
        </div>
        <div className="form-group">
          <label className="form-label">Nasiya (so'm)</label>
          <input className="form-input" type="number" value={form.debt} onChange={e => setForm(f => ({ ...f, debt: +e.target.value }))} min={0} />
        </div>
        <div className="form-group">
          <label className="form-label">Izoh</label>
          <textarea className="form-input" rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
        </div>
      </Modal>

      <Confirm open={!!confirmDel} onCancel={() => setConfirmDel(null)} onConfirm={handleDelete}
        title="Hamkorni o'chirish" message="Bu hamkorni o'chirmoqchimisiz?" danger />
    </div>
  );
}
