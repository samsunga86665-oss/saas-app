// src/pages/ProductsPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProducts, createProduct, updateProduct, deleteProduct, getSklad, updateSkladItem } from '../firebase/db';
import { Modal, useToast, Confirm, EmptyState, SearchInput, Spinner } from '../components/shared/UI';
import { Plus, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';

const EMPTY = { name: '', price: 0, buyPrice: 0, unit: 'dona', category: '', barcode: '', description: '' };

export default function ProductsPage() {
  const { activeCompany } = useAuth();
  const [products, setProducts] = useState([]);
  const [sklad, setSklad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!activeCompany?.id) return;
    const u1 = getProducts(activeCompany.id, d => { setProducts(d); setLoading(false); });
    const u2 = getSklad(activeCompany.id, setSklad);
    return () => { u1(); u2(); };
  }, [activeCompany?.id]);

  const getStock = (pid) => sklad.find(s => s.id === pid)?.quantity || 0;

  const filtered = products.filter(p => !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  const handleSave = async () => {
    if (!form.name) return toast('Nomni kiriting', 'error');
    setSaving(true);
    try {
      if (editId) {
        await updateProduct(activeCompany.id, editId, form);
        toast('Mahsulot yangilandi', 'success');
      } else {
        const id = await createProduct(activeCompany.id, form);
        await updateSkladItem(activeCompany.id, id, 0);
        toast('Mahsulot qo\'shildi!', 'success');
      }
      setShowForm(false);
      setForm(EMPTY);
      setEditId(null);
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleEdit = (p) => {
    setForm({ name: p.name || '', price: p.price || 0, buyPrice: p.buyPrice || 0, unit: p.unit || 'dona', category: p.category || '', barcode: p.barcode || '', description: p.description || '' });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(activeCompany.id, confirmDel);
      toast('Mahsulot o\'chirildi', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setConfirmDel(null);
  };

  const handleStockUpdate = async (productId, qty) => {
    try {
      await updateSkladItem(activeCompany.id, productId, qty);
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Mahsulotlar</div>
          <div className="page-subtitle">{products.length} ta mahsulot</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }}>
          <Plus size={16} /> Yangi mahsulot
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Nom, kategoriya, shtrixkod..." />
      </div>

      {loading ? <Spinner center /> : filtered.length === 0 ? (
        <EmptyState icon={Package} title="Mahsulotlar yo'q"
          action={<button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Qo'shish</button>} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mahsulot</th>
                <th>Kategoriya</th>
                <th>Sotish narxi</th>
                <th>Xarid narxi</th>
                <th>Birlik</th>
                <th>Sklad</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const stock = getStock(p.id);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.barcode && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.barcode}</div>}
                    </td>
                    <td>
                      {p.category ? <span className="badge badge-blue">{p.category}</span> : '—'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{(p.price || 0).toLocaleString()} so'm</td>
                    <td style={{ color: 'var(--text-muted)' }}>{(p.buyPrice || 0).toLocaleString()} so'm</td>
                    <td>{p.unit}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {stock <= 5 && stock > 0 && <AlertTriangle size={14} color="var(--warning)" />}
                        {stock === 0 && <AlertTriangle size={14} color="var(--danger)" />}
                        <input type="number" value={stock} min={0}
                          onChange={e => handleStockUpdate(p.id, +e.target.value)}
                          className="form-input" style={{ width: 80, padding: '4px 8px' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.unit}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" onClick={() => handleEdit(p)}><Edit2 size={14} /></button>
                        <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDel(p.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Mahsulot tahrirlash' : 'Yangi mahsulot'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Bekor</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>Saqlash</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Mahsulot nomi *</label>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nomini kiriting" />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Sotish narxi (so'm)</label>
            <input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} min={0} />
          </div>
          <div className="form-group">
            <label className="form-label">Xarid narxi (so'm)</label>
            <input className="form-input" type="number" value={form.buyPrice} onChange={e => setForm(f => ({ ...f, buyPrice: +e.target.value }))} min={0} />
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Kategoriya</label>
            <input className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Kategoriya" />
          </div>
          <div className="form-group">
            <label className="form-label">Birlik</label>
            <select className="form-input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
              <option value="dona">Dona</option>
              <option value="kg">Kilogramm</option>
              <option value="l">Litr</option>
              <option value="m">Metr</option>
              <option value="box">Quti</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Shtrixkod</label>
          <input className="form-input" value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} placeholder="Shtrixkod" />
        </div>
        <div className="form-group">
          <label className="form-label">Tavsif</label>
          <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </Modal>

      <Confirm open={!!confirmDel} onCancel={() => setConfirmDel(null)} onConfirm={handleDelete}
        title="Mahsulotni o'chirish" message="Bu mahsulotni o'chirmoqchimisiz?" danger />
    </div>
  );
}
