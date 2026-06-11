# 🚀 White-Label SaaS Platform

Universal ko'p kompaniyali SaaS ilova — React + Firebase Realtime Database + Vercel.

## 📁 Loyiha strukturasi

```
src/
├── firebase/
│   ├── config.js          # Firebase sozlamalari
│   └── db.js              # Barcha database funksiyalari
├── context/
│   ├── AuthContext.js     # Login, session, impersonate
│   └── ThemeContext.js    # Dark/light mode, kompaniya rangi
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.js
│   ├── layout/
│   │   ├── AppLayout.js
│   │   ├── Sidebar.js
│   │   └── Topbar.js
│   └── shared/
│       └── UI.js          # Modal, Toast, Spinner, ColorPicker...
├── pages/
│   ├── LoginPage.js       # Login (kompaniya + superowner)
│   ├── SuperownerPage.js  # Superowner boshqaruv paneli
│   ├── DashboardPage.js   # Asosiy panel (grafik, statistika)
│   ├── OrdersPage.js      # Buyurtmalar + chek chiqarish
│   ├── ClientsPage.js     # Hamkorlar + nasiya
│   ├── ProductsPage.js    # Mahsulotlar
│   ├── WorkersPage.js     # Ishchilar boshqaruvi
│   └── OtherPages.js      # Settings, Reports, Expenses, Sklad, Calendar
├── styles/
│   └── global.css         # Barcha CSS (dark mode, responsive)
└── App.js                 # Router va providerlar
```

## ⚙️ O'rnatish

### 1. Firebase loyiha yaratish

1. [Firebase Console](https://console.firebase.google.com) → Yangi loyiha
2. **Realtime Database** → Yaratish → Test mode tanlang
3. **Project Settings** → Web ilovasi qo'shish → Config nusxa oling

### 2. Loyihani klonlash va sozlash

```bash
# Dependencies o'rnatish
npm install

# .env.local fayl yaratish
cp .env.example .env.local
# .env.local ni to'ldiring Firebase config bilan
```

### 3. Firebase Rules sozlash

Firebase Console → Realtime Database → Rules → `firebase.rules.json` ichidagi qoidalarni joylashtiring.

### 4. Ishga tushirish

```bash
npm start
```

## 🔑 Login ma'lumotlari

### Superowner kirish
- Telefon: `998901234567`
- Parol: `superowner123`
- Kompaniya kodi: **kerak emas**

> Superowner birinchi marta kirganda avtomatik yaratiladi.

### Kompaniya foydalanuvchisi
1. Avval Superowner paneliga kiring
2. Yangi kompaniya yarating (nom + kod + rang)
3. Kompaniya sahifasiga kiring → Workers → Ishchi qo'shing
4. Shu ishchi ma'lumotlari bilan login qiling

## 🎨 Funksiyalar

| Sahifa | Imkoniyatlar |
|--------|-------------|
| **Login** | Kompaniya kodi + telefon + parol; Superowner alohida |
| **Superowner** | Kompaniya qo'shish, bloklash, ichiga kirish (impersonate) |
| **Dashboard** | Statistika kartalar, haftalik grafik, so'nggi buyurtmalar |
| **Buyurtmalar** | CRUD, holat o'zgartirish, chek chiqarish, nasiya, chegirma |
| **Hamkorlar** | CRUD, nasiya kuzatish, qidirish |
| **Mahsulotlar** | CRUD, narx (sotish/xarid), kategoriya, sklad miqdori |
| **Sklad** | Real-time miqdor yangilash, kam qolganlar ogohlantirish |
| **Xarajatlar** | Xarajat qo'shish, kategoriya bo'yicha |
| **Hisobot** | Daromad/xarajat grafik, buyurtma holatlari pie chart |
| **Kalendar** | Oylik ko'rinish, kun buyurtmalari |
| **Ishchilar** | Foydalanuvchi CRUD, rol belgilash, bloklash |
| **Sozlamalar** | Kompaniya nomi, telefon, logo, rang o'zgartirish |

## 🌐 Vercel Deploy

```bash
# Vercel CLI orqali
npm install -g vercel
vercel --prod

# Yoki GitHub bilan ulash:
# vercel.com → Import Project → GitHub repo tanlang
# Environment Variables qo'shing (.env.local dagi barcha qiymatlar)
```

## 🏗️ Firebase Database struktura

```
/
├── superowner/
│   ├── phone: "998901234567"
│   ├── password: "superowner123"
│   ├── name: "Nozimjon"
│   └── role: "superowner"
│
└── companies/
    └── {companyId}/
        ├── settings/
        │   ├── name: "MSMUZ"
        │   ├── companyCode: "MSMUZ"
        │   ├── primaryColor: "#6366f1"
        │   ├── logo: ""
        │   ├── phone: ""
        │   └── blocked: false
        ├── users/
        │   └── {userId}/
        │       ├── name, phone, password, role, active
        ├── orders/
        │   └── {orderId}/
        │       ├── clientId, clientName, items[], total
        │       ├── status, paymentType, nasiya, discount, note
        │       └── createdAt
        ├── clients/
        │   └── {clientId}/ (name, phone, address, debt, note)
        ├── products/
        │   └── {productId}/ (name, price, buyPrice, unit, category, barcode)
        ├── sklad/
        │   └── {productId}/ (quantity, updatedAt)
        └── expenses/
            └── {expenseId}/ (title, amount, category, note, createdAt)
```

## 🔐 Foydalanuvchi rollari

| Rol | Imkoniyatlar |
|-----|-------------|
| `superowner` | Barcha kompaniyalar + impersonate |
| `owner` | O'z kompaniyasi — to'liq boshqaruv |
| `super_admin` | Kompaniya — ishchilardan tashqari hamma |
| `sales_agent` | Buyurtmalar, hamkorlar, kalendar |

## 💡 Muhim eslatmalar

- **Xavfsizlik**: Parollar Firebase'da ochiq saqlansa ham, production uchun Firebase Authentication ishlatish tavsiya etiladi
- **Izolyatsiya**: Har kompaniya faqat o'z `companies/{companyId}/` ma'lumotlarini ko'radi
- **Real-time**: Barcha ma'lumotlar real vaqtda yangilanadi (Firebase onValue)
- **Rang**: `--primary` CSS o'zgaruvchisi orqali butun interfeys kompaniya rangi bilan bo'yaladi
