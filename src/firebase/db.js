// src/firebase/db.js
import { db } from './config';
import {
  ref, get, set, push, update, remove,
  onValue, off, serverTimestamp, query, orderByChild, equalTo
} from 'firebase/database';

// ─── COMPANIES ───────────────────────────────────────────────────────────────

export const getCompanies = (callback) => {
  const r = ref(db, 'companies');
  onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, val]) => ({ id, ...val })));
  });
  return () => off(r);
};

export const getCompanyByCode = async (code) => {
  const snap = await get(ref(db, 'companies'));
  if (!snap.exists()) return null;
  const companies = snap.val();
  const entry = Object.entries(companies).find(
    ([, v]) => v.settings?.companyCode === code
  );
  return entry ? { id: entry[0], ...entry[1] } : null;
};

export const createCompany = async (data) => {
  const newRef = push(ref(db, 'companies'));
  await set(newRef, {
    settings: {
      name: data.name,
      companyCode: data.code,
      primaryColor: data.color || '#6366f1',
      businessEmoji: data.businessEmoji || '🏢',
      businessLabel: data.businessLabel || 'Kompaniya',
      logo: data.logo || '',
      phone: data.phone || '',
      blocked: false,
      createdAt: Date.now()
    },
    users: {},
    orders: {},
    clients: {},
    products: {},
    sklad: {}
  });
  return newRef.key;
};

export const updateCompanySettings = async (companyId, settings) => {
  await update(ref(db, `companies/${companyId}/settings`), settings);
};

export const toggleCompanyBlock = async (companyId, blocked) => {
  await update(ref(db, `companies/${companyId}/settings`), { blocked });
};

// ─── USERS ────────────────────────────────────────────────────────────────────

export const getUser = async (companyId, phone) => {
  const snap = await get(ref(db, `companies/${companyId}/users`));
  if (!snap.exists()) return null;
  const users = snap.val();
  const entry = Object.entries(users).find(
    ([, u]) => u.phone === phone
  );
  return entry ? { id: entry[0], ...entry[1] } : null;
};

export const getSuperowner = async (phone) => {
  const snap = await get(ref(db, 'superowner'));
  if (!snap.exists()) return null;
  const data = snap.val();
  if (data.phone === phone) return { id: 'superowner', ...data };
  return null;
};

export const createUser = async (companyId, userData) => {
  const newRef = push(ref(db, `companies/${companyId}/users`));
  await set(newRef, { ...userData, createdAt: Date.now() });
  return newRef.key;
};

export const getUsers = (companyId, callback) => {
  const r = ref(db, `companies/${companyId}/users`);
  onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, val]) => ({ id, ...val })));
  });
  return () => off(r);
};

export const updateUser = async (companyId, userId, data) => {
  await update(ref(db, `companies/${companyId}/users/${userId}`), data);
};

export const deleteUser = async (companyId, userId) => {
  await remove(ref(db, `companies/${companyId}/users/${userId}`));
};

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export const getOrders = (companyId, callback) => {
  const r = ref(db, `companies/${companyId}/orders`);
  onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, val]) => ({ id, ...val })));
  });
  return () => off(r);
};

export const createOrder = async (companyId, orderData) => {
  const newRef = push(ref(db, `companies/${companyId}/orders`));
  await set(newRef, { ...orderData, createdAt: Date.now(), status: 'new' });
  return newRef.key;
};

export const updateOrder = async (companyId, orderId, data) => {
  await update(ref(db, `companies/${companyId}/orders/${orderId}`), data);
};

export const deleteOrder = async (companyId, orderId) => {
  await remove(ref(db, `companies/${companyId}/orders/${orderId}`));
};

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

export const getClients = (companyId, callback) => {
  const r = ref(db, `companies/${companyId}/clients`);
  onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, val]) => ({ id, ...val })));
  });
  return () => off(r);
};

export const createClient = async (companyId, clientData) => {
  const newRef = push(ref(db, `companies/${companyId}/clients`));
  await set(newRef, { ...clientData, debt: 0, createdAt: Date.now() });
  return newRef.key;
};

export const updateClient = async (companyId, clientId, data) => {
  await update(ref(db, `companies/${companyId}/clients/${clientId}`), data);
};

export const deleteClient = async (companyId, clientId) => {
  await remove(ref(db, `companies/${companyId}/clients/${clientId}`));
};

// ─── PRODUCTS / SKLAD ─────────────────────────────────────────────────────────

export const getProducts = (companyId, callback) => {
  const r = ref(db, `companies/${companyId}/products`);
  onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, val]) => ({ id, ...val })));
  });
  return () => off(r);
};

export const createProduct = async (companyId, productData) => {
  const newRef = push(ref(db, `companies/${companyId}/products`));
  await set(newRef, { ...productData, createdAt: Date.now() });
  return newRef.key;
};

export const updateProduct = async (companyId, productId, data) => {
  await update(ref(db, `companies/${companyId}/products/${productId}`), data);
};

export const deleteProduct = async (companyId, productId) => {
  await remove(ref(db, `companies/${companyId}/products/${productId}`));
};

export const getSklad = (companyId, callback) => {
  const r = ref(db, `companies/${companyId}/sklad`);
  onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, val]) => ({ id, ...val })));
  });
  return () => off(r);
};

export const updateSkladItem = async (companyId, productId, quantity) => {
  await update(ref(db, `companies/${companyId}/sklad/${productId}`), { quantity, updatedAt: Date.now() });
};

// ─── EXPENSES ─────────────────────────────────────────────────────────────────

export const getExpenses = (companyId, callback) => {
  const r = ref(db, `companies/${companyId}/expenses`);
  onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, val]) => ({ id, ...val })));
  });
  return () => off(r);
};

export const createExpense = async (companyId, data) => {
  const newRef = push(ref(db, `companies/${companyId}/expenses`));
  await set(newRef, { ...data, createdAt: Date.now() });
  return newRef.key;
};

// ─── INIT SUPEROWNER (run once) ───────────────────────────────────────────────

export const initSuperowner = async () => {
  const snap = await get(ref(db, 'superowner'));
  if (!snap.exists()) {
    await set(ref(db, 'superowner'), {
      phone: '998901234567',
      password: 'superowner123',
      name: 'Nozimjon',
      role: 'superowner'
    });
    console.log('Superowner created: phone=998901234567, password=superowner123');
  }
};
