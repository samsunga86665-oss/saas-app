// src/components/layout/Topbar.js
import React from 'react';
import { Menu, Moon, Sun, Bell, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ onMenuClick, title }) {
  const { activeCompany, isSuperowner, impersonating, stopImpersonating } = useAuth();
  const { darkMode, toggleDark } = useTheme();
  const nav = useNavigate();

  return (
    <header className="topbar">
      <button className="btn-icon" style={{ border: 'none' }} onClick={onMenuClick}>
        <Menu size={20} />
      </button>

      {impersonating && (
        <button className="btn btn-ghost btn-sm" onClick={stopImpersonating}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d97706', borderColor: '#d97706' }}>
          <ArrowLeft size={14} />
          Superowner paneliga qaytish
        </button>
      )}

      <div style={{ flex: 1 }}>
        {title && <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn-icon" onClick={toggleDark} style={{ border: 'none' }}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="btn-icon" style={{ border: 'none', position: 'relative' }}>
          <Bell size={18} />
        </button>
        {isSuperowner && !impersonating && (
          <button className="btn btn-ghost btn-sm" onClick={() => nav('/superowner')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            🛡️ Superowner
          </button>
        )}
      </div>
    </header>
  );
}
