// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUser, getSuperowner, getCompanyByCode } from '../firebase/db';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/config';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(null); // for superowner

  useEffect(() => {
    const saved = localStorage.getItem('saas_session');
    if (saved) {
      try {
        const session = JSON.parse(saved);
        setUser(session.user);
        setCompany(session.company);
        setImpersonating(session.impersonating || null);
      } catch {}
    }
    setLoading(false);
  }, []);

  // Listen for company settings changes (color, logo, etc)
  useEffect(() => {
    if (!company?.id) return;
    const r = ref(db, `companies/${company.id}/settings`);
    const unsub = onValue(r, (snap) => {
      if (snap.exists()) {
        const updated = { ...company, settings: snap.val() };
        setCompany(updated);
        const saved = localStorage.getItem('saas_session');
        if (saved) {
          const session = JSON.parse(saved);
          localStorage.setItem('saas_session', JSON.stringify({ ...session, company: updated }));
        }
      }
    });
    return unsub;
  }, [company?.id]);

  const loginSuperowner = async (phone, password) => {
    const so = await getSuperowner(phone);
    if (!so) throw new Error('Superowner topilmadi');
    if (so.password !== password) throw new Error('Parol noto\'g\'ri');
    const session = { user: so, company: null, impersonating: null };
    localStorage.setItem('saas_session', JSON.stringify(session));
    setUser(so);
    setCompany(null);
    return so;
  };

  const loginCompanyUser = async (phone, password, companyCode) => {
    const comp = await getCompanyByCode(companyCode);
    if (!comp) throw new Error('Kompaniya kodi noto\'g\'ri');
    if (comp.settings?.blocked) throw new Error('Kompaniya bloklangan');
    const u = await getUser(comp.id, phone);
    if (!u) throw new Error('Foydalanuvchi topilmadi');
    if (u.password !== password) throw new Error('Parol noto\'g\'ri');
    if (!u.active) throw new Error('Akkaunt faol emas');
    const session = { user: u, company: comp };
    localStorage.setItem('saas_session', JSON.stringify(session));
    setUser(u);
    setCompany(comp);
    return { user: u, company: comp };
  };

  const impersonateCompany = (comp) => {
    setImpersonating(comp);
    const saved = JSON.parse(localStorage.getItem('saas_session') || '{}');
    localStorage.setItem('saas_session', JSON.stringify({ ...saved, impersonating: comp }));
  };

  const stopImpersonating = () => {
    setImpersonating(null);
    const saved = JSON.parse(localStorage.getItem('saas_session') || '{}');
    localStorage.setItem('saas_session', JSON.stringify({ ...saved, impersonating: null }));
  };

  const logout = () => {
    localStorage.removeItem('saas_session');
    setUser(null);
    setCompany(null);
    setImpersonating(null);
  };

  // The active company: impersonating > own company
  const activeCompany = impersonating || company;

  return (
    <AuthContext.Provider value={{
      user, company, activeCompany, loading,
      impersonating, impersonateCompany, stopImpersonating,
      loginSuperowner, loginCompanyUser, logout,
      isSuperowner: user?.role === 'superowner',
      isOwner: user?.role === 'owner',
      isSuperAdmin: user?.role === 'super_admin',
      isSalesAgent: user?.role === 'sales_agent',
    }}>
      {children}
    </AuthContext.Provider>
  );
};
