// src/pages/WorkersPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser } from '../firebase/db';
import { Modal, useToast, Confirm, EmptyState, SearchInput, Spinner } from '../components/shared/UI';
import { Plus, Edit2, Trash2, UserCog, Eye, EyeOff } from 'lucide-react';

const ROLES = { owner: 'Egasi', super_admin: 'Admin', sales_agent: 'Savdo agenti' };
const EMPTY = { name: '', phone: '', password: '', role: 'sales_agent', active: true };

export default function WorkersPage() {
  const { activeCompany, user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [search, setSearch] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (!activeCompany?.id) return;
    const unsub = getUsers(activeCompany.id, d => { setUsers(d); setLoading(false); });
    return unsub;
  }, [activeCompany?.id]);

  const filtered = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search));

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.password) return toast('Barcha maydonlarni to\'ldiring', 'error');
    setSaving(true);
    try {
      if (editId) {
        await updateUser(activeCompany.id, editId, form);
        toast('Ishchi yangilandi', 'success');
      } else {
        const exists = users.find(u => u.phone === form.phone);
        if (exists) return toast('Bu telefon allaqachon ro\'yxatda', 'error');
        await createUser(activeCompany.id, form);
        toast('Ishchi qo\'shildi!', 'success');
      }
      setShowForm(false);
      setForm(EMPTY);
      setEditId(null);
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleEdit = (u) => {
    setForm({ name: u.name || '', phone: u.phone || '', password: u.password || '', role: u.role || 'sales_agent', active: u.active !== false });
    setEditId(u.id);
    setShowForm(true);
  };

  const handleToggleActive = async (userId, active) => {
    try {
      await updateUser(activeCompany.id, userId, { active: !active });
      toast(!active ? 'Faollashtirildi' : 'Bloklandi', 'success');
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(activeCompany.id, confirmDel);
      toast('Ishchi o\'chirildi', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setConfirmDel(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Ishchilar</div>
          <div className="page-subtitle">{users.length} ta foydalanuvchi</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }}>
          <Plus size={16} /> Yangi ishchi
        </button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Ism yoki telefon..." />
      </div>
      {loading ? <Spinner center /> : filtered.length === 0 ? (
        <EmptyState icon={UserCog} title="Ishchilar yo'q"
          action={<button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Qo'shish</button>} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Ism</th><th>Telefon</th><th>Rol</th><th>Holat</th><th>Amallar</th></tr></thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {u.name?.[0]}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td>{u.phone}</td>
                  <td><span className="badge badge-blue">{ROLES[u.role] || u.role}</span></td>
                  <td>
                    <button onClick={() => handleToggleActive(u.id, u.active !== false)}
                      className={`badge ${u.active !== false ? 'badge-green' : 'badge-red'}`} style={{ border: 'none', cursor: 'pointer' }}>
                      {u.active !== false ? '✅ Faol' : '🔒 Bloklangan'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" onClick={() => handleEdit(u)}><Edit2 size={14} /></button>
                      {u.id !== me?.id && (
                        <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDel(u.id)}><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Ishchi tahrirlash' : 'Yangi ishchi'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Bekor</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>Saqlash</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Ism *</label>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="To'liq ism" />
        </div>
        <div className="form-group">
          <label className="form-label">Telefon *</label>
          <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="998..." />
        </div>
        <div className="form-group">
          <label className="form-label">Parol *</label>
          <div style={{ position: 'relative' }}>
            <input className="form-input" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Rol</label>
          <select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
          <label htmlFor="active" style={{ cursor: 'pointer' }}>Faol akkaunt</label>
        </div>
      </Modal>

      <Confirm open={!!confirmDel} onCancel={() => setConfirmDel(null)} onConfirm={handleDelete}
        title="Ishchini o'chirish" message="Bu foydalanuvchini o'chirmoqchimisiz?" danger />
    </div>
  );
}
