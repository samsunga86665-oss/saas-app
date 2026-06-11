// src/pages/OrdersPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOrders, createOrder, updateOrder, deleteOrder, getClients, getProducts, updateClient, updateSkladItem, getSklad } from '../firebase/db';
import { Modal, useToast, Confirm, EmptyState, SearchInput, Spinner } from '../components/shared/UI';
import { Plus, Printer, Edit2, Trash2, ShoppingCart, CheckCircle, XCircle, Clock, TrendingUp, Eye } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_MAP = {
  new: { label: 'Yangi', cls: 'badge-yellow' },
  processing: { label: 'Jarayonda', cls: 'badge-blue' },
  completed: { label: 'Tugallangan', cls: 'badge-green' },
  cancelled: { label: 'Bekor', cls: 'badge-red' },
};

const EMPTY_FORM = { clientId: '', clientName: '', items: [], note: '', paymentType: 'cash', nasiya: false, discount: 0 };

export default function OrdersPage() {
  const { activeCompany } = useAuth();
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [sklad, setSklad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const toast = useToast();
  const printRef = useRef();

  useEffect(() => {
    if (!activeCompany?.id) return;
    const unsubs = [
      getOrders(activeCompany.id, d => { setOrders(d); setLoading(false); }),
      getClients(activeCompany.id, setClients),
      getProducts(activeCompany.id, setProducts),
      getSklad(activeCompany.id, setSklad),
    ];
    return () => unsubs.forEach(u => u());
  }, [activeCompany?.id]);

  const filtered = orders
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o => !search || o.clientName?.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search));

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', productName: '', qty: 1, price: 0 }] }));

  const updateItem = (idx, field, value) => setForm(f => ({
    ...f,
    items: f.items.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod) { updated.productName = prod.name; updated.price = prod.price || 0; }
      }
      return updated;
    })
  }));

  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const getTotal = () => form.items.reduce((s, i) => s + (i.qty * i.price), 0) * (1 - (form.discount || 0) / 100);

  const handleSave = async () => {
    if (!form.clientId && !form.clientName) return toast('Hamkor tanlang', 'error');
    if (form.items.length === 0) return toast('Mahsulot qo\'shing', 'error');
    setSaving(true);
    try {
      const orderData = { ...form, total: getTotal(), status: editId ? undefined : 'new' };
      if (editId) {
        await updateOrder(activeCompany.id, editId, orderData);
        toast('Buyurtma yangilandi', 'success');
      } else {
        const id = await createOrder(activeCompany.id, orderData);
        // Update client debt if nasiya
        if (form.nasiya && form.clientId) {
          const client = clients.find(c => c.id === form.clientId);
          if (client) await updateClient(activeCompany.id, form.clientId, { debt: (client.debt || 0) + getTotal() });
        }
        toast('Buyurtma yaratildi!', 'success');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (order) => {
    setForm({ clientId: order.clientId || '', clientName: order.clientName || '', items: order.items || [], note: order.note || '', paymentType: order.paymentType || 'cash', nasiya: order.nasiya || false, discount: order.discount || 0 });
    setEditId(order.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteOrder(activeCompany.id, confirmDel);
      toast('Buyurtma o\'chirildi', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setConfirmDel(null);
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrder(activeCompany.id, orderId, { status });
      if (status === 'completed') {
        const order = orders.find(o => o.id === orderId);
        if (order?.nasiya && order.clientId) {
          // Clear nasiya
          const client = clients.find(c => c.id === order.clientId);
          if (client) await updateClient(activeCompany.id, order.clientId, { debt: Math.max(0, (client.debt || 0) - (order.total || 0)) });
        }
      }
      toast('Holat yangilandi', 'success');
    } catch (e) { toast(e.message, 'error'); }
  };

  const handlePrint = (order) => {
    const comp = activeCompany?.settings || {};
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Chek</title>
      <style>
        body { font-family: monospace; max-width: 350px; margin: 0 auto; padding: 16px; }
        .center { text-align: center; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; } td { padding: 2px 4px; }
        .total { font-size: 18px; font-weight: bold; }
        @media print { button { display: none; } }
      </style></head><body>
      <div class="center"><h2>${comp.name || 'Kompaniya'}</h2></div>
      <div class="center">${comp.phone || ''}</div>
      <div class="line"></div>
      <div>Sana: ${format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}</div>
      <div>Chek: #${order.id.slice(-8).toUpperCase()}</div>
      <div>Hamkor: ${order.clientName || '—'}</div>
      <div>To'lov: ${order.paymentType === 'cash' ? 'Naqd' : order.paymentType === 'card' ? 'Karta' : 'Nasiya'}</div>
      <div class="line"></div>
      <table>
        <tr><th>Mahsulot</th><th>Soni</th><th>Narx</th><th>Jami</th></tr>
        ${(order.items || []).map(i => `<tr><td>${i.productName}</td><td>${i.qty}</td><td>${i.price?.toLocaleString()}</td><td>${(i.qty*i.price)?.toLocaleString()}</td></tr>`).join('')}
      </table>
      <div class="line"></div>
      ${order.discount ? `<div>Chegirma: ${order.discount}%</div>` : ''}
      <div class="total center">JAMI: ${(order.total || 0).toLocaleString()} so'm</div>
      <div class="line"></div>
      <div class="center">Xarid uchun rahmat!</div>
      <button onclick="window.print()">Chop etish</button>
    </body></html>`);
    win.document.close();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Buyurtmalar</div>
          <div className="page-subtitle">{orders.length} ta buyurtma</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}>
          <Plus size={16} /> Yangi buyurtma
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Buyurtma yoki hamkor qidirish..." />
        </div>
        {Object.entries({ all: 'Barchasi', ...Object.fromEntries(Object.entries(STATUS_MAP).map(([k, v]) => [k, v.label])) }).map(([key, label]) => (
          <button key={key} className={`btn ${statusFilter === key ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setStatusFilter(key)}>{label}</button>
        ))}
      </div>

      {loading ? <Spinner center /> : filtered.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Buyurtmalar yo'q" desc="Birinchi buyurtmani yarating"
          action={<button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Buyurtma</button>} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Raqam</th>
                <th>Sana</th>
                <th>Hamkor</th>
                <th>Mahsulotlar</th>
                <th>Summa</th>
                <th>To'lov</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {[...filtered].sort((a, b) => b.createdAt - a.createdAt).map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>#{order.id.slice(-6).toUpperCase()}</td>
                  <td style={{ fontSize: 13 }}>{order.createdAt ? format(new Date(order.createdAt), 'dd.MM.yy HH:mm') : '—'}</td>
                  <td>{order.clientName || '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{(order.items || []).length} tur</td>
                  <td style={{ fontWeight: 700 }}>{(order.total || 0).toLocaleString()} so'm</td>
                  <td>
                    <span className="badge badge-gray">
                      {order.paymentType === 'cash' ? '💵 Naqd' : order.paymentType === 'card' ? '💳 Karta' : '📋 Nasiya'}
                    </span>
                  </td>
                  <td>
                    <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)}
                      className="form-input" style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}>
                      {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" onClick={() => setShowDetail(order)} title="Ko'rish"><Eye size={14} /></button>
                      <button className="btn-icon" onClick={() => handlePrint(order)} title="Chop etish"><Printer size={14} /></button>
                      <button className="btn-icon" onClick={() => handleEdit(order)} title="Tahrirlash"><Edit2 size={14} /></button>
                      <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDel(order.id)} title="O'chirish"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Order Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Buyurtmani tahrirlash' : 'Yangi buyurtma'} maxWidth={680}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Bekor</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <div className="spinner" style={{ width: 16, height: 16 }} /> : null}
              Saqlash
            </button>
          </>
        }
      >
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Hamkor</label>
            <select className="form-input" value={form.clientId}
              onChange={e => {
                const client = clients.find(c => c.id === e.target.value);
                setForm(f => ({ ...f, clientId: e.target.value, clientName: client?.name || '' }));
              }}>
              <option value="">Hamkor tanlang</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">To'lov usuli</label>
            <select className="form-input" value={form.paymentType} onChange={e => setForm(f => ({ ...f, paymentType: e.target.value }))}>
              <option value="cash">💵 Naqd</option>
              <option value="card">💳 Karta</option>
              <option value="transfer">🏦 O'tkazma</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" id="nasiya" checked={form.nasiya} onChange={e => setForm(f => ({ ...f, nasiya: e.target.checked }))} />
          <label htmlFor="nasiya" style={{ cursor: 'pointer', fontSize: 14 }}>Nasiya</label>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Chegirma %:</label>
            <input type="number" className="form-input" value={form.discount} min={0} max={100}
              onChange={e => setForm(f => ({ ...f, discount: +e.target.value }))}
              style={{ width: 80 }} />
          </div>
        </div>

        {/* Items */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Mahsulotlar</label>
            <button className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={14} /> Qo'shish</button>
          </div>
          {form.items.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
              <select className="form-input" value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)}>
                <option value="">Mahsulot</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" className="form-input" value={item.qty} min={1} onChange={e => updateItem(idx, 'qty', +e.target.value)} placeholder="Soni" style={{ width: 80 }} />
              <input type="number" className="form-input" value={item.price} onChange={e => updateItem(idx, 'price', +e.target.value)} placeholder="Narx" style={{ width: 100 }} />
              <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => removeItem(idx)}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label className="form-label">Izoh</label>
          <textarea className="form-input" rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
        </div>

        {form.items.length > 0 && (
          <div style={{ background: 'var(--hover)', borderRadius: 8, padding: '12px 16px', fontWeight: 700, fontSize: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>Jami:</span>
            <span style={{ color: 'var(--primary)' }}>{getTotal().toLocaleString()} so'm</span>
          </div>
        )}
      </Modal>

      {/* Detail Modal */}
      {showDetail && (
        <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title={`Buyurtma #${showDetail.id.slice(-6).toUpperCase()}`}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowDetail(null)}>Yopish</button>
              <button className="btn btn-primary" onClick={() => handlePrint(showDetail)}><Printer size={14} /> Chop etish</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Hamkor:</span>
              <span style={{ fontWeight: 600 }}>{showDetail.clientName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Sana:</span>
              <span>{showDetail.createdAt ? format(new Date(showDetail.createdAt), 'dd.MM.yyyy HH:mm') : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>To'lov:</span>
              <span>{showDetail.paymentType === 'cash' ? '💵 Naqd' : showDetail.paymentType === 'card' ? '💳 Karta' : '📋 Nasiya'}</span>
            </div>
          </div>
          <div className="table-wrap" style={{ marginTop: 8 }}>
            <table>
              <thead><tr><th>Mahsulot</th><th>Soni</th><th>Narx</th><th>Jami</th></tr></thead>
              <tbody>
                {(showDetail.items || []).map((item, i) => (
                  <tr key={i}>
                    <td>{item.productName}</td>
                    <td>{item.qty}</td>
                    <td>{(item.price || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{(item.qty * item.price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showDetail.discount > 0 && <div style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Chegirma: {showDetail.discount}%</div>}
          <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '12px 16px', fontWeight: 700, fontSize: 18, display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
            <span>JAMI:</span>
            <span>{(showDetail.total || 0).toLocaleString()} so'm</span>
          </div>
          {showDetail.note && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Izoh: {showDetail.note}</div>}
        </Modal>
      )}

      <Confirm open={!!confirmDel} onCancel={() => setConfirmDel(null)} onConfirm={handleDelete}
        title="Buyurtmani o'chirish" message="Bu buyurtmani o'chirmoqchimisiz?" danger />
    </div>
  );
}
