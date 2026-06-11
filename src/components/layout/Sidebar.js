// src/components/layout/Sidebar.js
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ShoppingCart, Users, Package,
  Warehouse, BarChart3, Calendar, Receipt, Settings,
  LogOut, Building2, ChevronRight, UserCog, DollarSign
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Asosiy', roles: ['owner', 'super_admin', 'sales_agent'] },
  { to: '/orders', icon: ShoppingCart, label: 'Buyurtmalar', roles: ['owner', 'super_admin', 'sales_agent'] },
  { to: '/clients', icon: Users, label: 'Hamkorlar', roles: ['owner', 'super_admin', 'sales_agent'] },
  { to: '/products', icon: Package, label: 'Mahsulotlar', roles: ['owner', 'super_admin'] },
  { to: '/sklad', icon: Warehouse, label: 'Sklad', roles: ['owner', 'super_admin'] },
  { to: '/expenses', icon: DollarSign, label: 'Xarajatlar', roles: ['owner', 'super_admin'] },
  { to: '/reports', icon: BarChart3, label: 'Hisobot', roles: ['owner', 'super_admin'] },
  { to: '/calendar', icon: Calendar, label: 'Kalendar', roles: ['owner', 'super_admin', 'sales_agent'] },
  { to: '/workers', icon: UserCog, label: 'Ishchilar', roles: ['owner', 'super_admin'] },
  { to: '/settings', icon: Settings, label: 'Sozlamalar', roles: ['owner', 'super_admin'] },
];

export default function Sidebar({ open, onClose }) {
  const { user, activeCompany, isSuperowner, impersonating, stopImpersonating, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  const visibleItems = NAV_ITEMS.filter(item =>
    isSuperowner || item.roles.includes(user?.role)
  );

  const compColor = activeCompany?.settings?.primaryColor || 'var(--primary)';

  return (
    <>
      {/* Mobile overlay */}
      {open && <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        zIndex: 99, display: 'none'
      }} className="sidebar-overlay" />}

      <aside className={`sidebar${open ? ' open' : ''}`}>
        {/* Company branding */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: compColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 18, fontWeight: 800, color: '#fff'
            }}>
              {activeCompany?.settings?.logo
                ? <img src={activeCompany.settings.logo} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                : (activeCompany?.settings?.businessEmoji || activeCompany?.settings?.name?.[0] || '🏢')}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeCompany?.settings?.name || 'SaaS Platform'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ background: compColor, color: '#fff', padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>
                  {user?.role === 'superowner' ? 'SUPER' : user?.role?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Impersonating banner */}
          {impersonating && (
            <div style={{
              marginTop: 10, padding: '8px 10px',
              background: 'rgba(245,158,11,0.12)',
              borderRadius: 8, fontSize: 12,
              color: '#d97706', border: '1px solid rgba(245,158,11,0.3)'
            }}>
              <div style={{ fontWeight: 600 }}>👁 Ko'rib turibsiz:</div>
              <div>{impersonating.settings?.name}</div>
              <button onClick={stopImpersonating} style={{
                background: 'none', border: 'none', color: '#d97706',
                cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0, marginTop: 4
              }}>
                ← Qaytish
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: user info + logout */}
        <div style={{ borderTop: '1px solid var(--border)', padding: 12 }}>
          <div style={{ padding: '8px 8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: compColor, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14
            }}>
              {user?.name?.[0] || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || user?.phone}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.phone}</div>
            </div>
          </div>
          <button className="nav-item" style={{ width: '100%', color: 'var(--danger)' }} onClick={handleLogout}>
            <LogOut size={16} />
            Chiqish
          </button>
        </div>
      </aside>
    </>
  );
}
