// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOrders, getClients, getProducts, getSklad } from '../firebase/db';
import { ShoppingCart, Users, Package, Warehouse, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Spinner } from '../components/shared/UI';
import { format, subDays, startOfDay } from 'date-fns';

export default function DashboardPage() {
  const { activeCompany, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [sklad, setSklad] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCompany?.id) return;
    setLoading(true);
    const unsubs = [
      getOrders(activeCompany.id, setOrders),
      getClients(activeCompany.id, setClients),
      getProducts(activeCompany.id, setProducts),
      getSklad(activeCompany.id, setSklad),
    ];
    setLoading(false);
    return () => unsubs.forEach(u => u());
  }, [activeCompany?.id]);

  // Stats
  const today = startOfDay(new Date()).getTime();
  const todayOrders = orders.filter(o => o.createdAt >= today);
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'new' || o.status === 'processing');
  const totalDebt = clients.reduce((s, c) => s + (c.debt || 0), 0);

  // Chart data — last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const start = startOfDay(date).getTime();
    const end = start + 86400000;
    const dayOrders = orders.filter(o => o.createdAt >= start && o.createdAt < end);
    return {
      date: format(date, 'dd/MM'),
      buyurtmalar: dayOrders.length,
      daromad: dayOrders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total || 0), 0),
    };
  });

  const primary = activeCompany?.settings?.primaryColor || '#6366f1';

  if (loading) return <Spinner center />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Asosiy panel</div>
          <div className="page-subtitle">Salom, {user?.name || user?.phone}! Bugungi holat</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { icon: ShoppingCart, label: 'Bugungi buyurtmalar', value: todayOrders.length, color: primary, sub: `Jami: ${orders.length}` },
          { icon: TrendingUp, label: 'Umumiy daromad', value: `${totalRevenue.toLocaleString()} so'm`, color: '#10b981', sub: 'Tugallangan' },
          { icon: Users, label: 'Hamkorlar', value: clients.length, color: '#f59e0b', sub: `Nasiya: ${totalDebt.toLocaleString()} so'm` },
          { icon: Package, label: 'Mahsulotlar', value: products.length, color: '#8b5cf6', sub: `Sklad: ${sklad.length} tur` },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}><s.icon size={22} /></div>
            <div className="stat-value" style={{ fontSize: 20 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Revenue chart */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Haftalik buyurtmalar</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="buyurtmalar" stroke={primary} fill="url(#colorRev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by status */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Buyurtma holatlari</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Yangi', status: 'new', icon: Clock, color: '#f59e0b' },
              { label: 'Jarayonda', status: 'processing', icon: TrendingUp, color: primary },
              { label: 'Tugallangan', status: 'completed', icon: CheckCircle, color: '#10b981' },
              { label: 'Bekor', status: 'cancelled', icon: XCircle, color: '#ef4444' },
            ].map(s => {
              const count = orders.filter(o => o.status === s.status).length;
              const pct = orders.length ? (count / orders.length) * 100 : 0;
              return (
                <div key={s.status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      <s.icon size={14} color={s.color} /> {s.label}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: 'var(--hover)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 999, transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
          So'nggi buyurtmalar
        </div>
        {orders.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
            Hali buyurtmalar yo'q
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Raqam</th>
                  <th>Sana</th>
                  <th>Hamkor</th>
                  <th>Summa</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {[...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8).map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>#{order.id.slice(-6).toUpperCase()}</td>
                    <td>{order.createdAt ? format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm') : '—'}</td>
                    <td>{order.clientName || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{(order.total || 0).toLocaleString()} so'm</td>
                    <td>
                      <span className={`badge ${
                        order.status === 'completed' ? 'badge-green' :
                        order.status === 'cancelled' ? 'badge-red' :
                        order.status === 'processing' ? 'badge-blue' : 'badge-yellow'
                      }`}>
                        {order.status === 'new' ? 'Yangi' :
                         order.status === 'processing' ? 'Jarayonda' :
                         order.status === 'completed' ? 'Tugallangan' : 'Bekor'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
