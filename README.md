# RentalHub Backend – Equipment Rental Management System

## 📌 Project Name
**RentalHub (Backend API)**

## 👥 Team Members
- **Lwin Moh Moh Theint** – Project Leader, Backend, Frontend  
  GitHub: https://github.com/Tricia28-cs  
- **Sai Khun Naung Hein** – Frontend  
  GitHub: https://github.com/liamted49  
- **Soe Min Htet** – Backend, Frontend  
  GitHub: https://github.com/judethesleeper  

## 📝 Project Description (Short)
RentalHub is a full-stack web application for managing equipment rentals in universities, laboratories, media departments, and small businesses.  

The backend provides secure REST APIs for authentication, rental management, equipment availability, dashboard analytics, and user management. It handles all business logic, database operations, and access control for the RentalHub platform.

---
# RentalHub – Equipment Rental Management System

A full-stack web application for managing equipment rentals in universities, laboratories, media departments, and small businesses.

## Features

- **Role-Based Access Control**: Admin and Borrower roles with protected routes
- **Time-Based Rental Logic**: Overlap detection using date ranges (not status flags)
- **Auto Late Detection**: Automatically marks overdue rentals as "Late"
- **Dynamic Availability**: Equipment availability computed in real-time from rental records
- **Admin Dashboard**: Live analytics — active rentals, overdue counts, top equipment, availability charts
- **JWT Authentication**: Cookie-based, secure, server-side validated

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Next.js 14 (App Router) |
| Backend | Next.js API Routes (Node.js) |
| Database | MongoDB + Mongoose |
| Auth | JWT (bcryptjs hashing) |
| Deployment | Microsoft Azure (see below) |
| Time | All UTC, server-side only |

---

## Getting Started

### 1. Clone & Install

```bash
git clone <repo>
cd rentalhub
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/rentalhub
JWT_SECRET=your-super-secret-key-at-least-32-chars
```

### 3. Create Admin User

Since registration creates Borrowers only, create the first admin via MongoDB directly or a seed script:

```js
// scripts/seed-admin.js (run once with: node scripts/seed-admin.js)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const hash = await bcrypt.hash('admin123', 12);
  await mongoose.connection.collection('users').insertOne({
    name: 'Admin',
    email: 'admin@rentalhub.com',
    password: hash,
    role: 'Admin',
    contactNumber: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Admin created!');
  process.exit(0);
}
seed();
```

### 4. Run Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
rentalhub/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      # POST /api/auth/login
│   │   │   ├── register/route.ts   # POST /api/auth/register
│   │   │   └── me/route.ts         # GET /api/auth/me, DELETE (logout)
│   │   ├── equipment/
│   │   │   ├── route.ts            # GET all, POST create
│   │   │   └── [id]/route.ts       # GET one, PATCH, DELETE
│   │   ├── rentals/
│   │   │   ├── route.ts            # GET list, POST create
│   │   │   └── [id]/route.ts       # GET one, PATCH (actions)
│   │   ├── users/route.ts          # GET all users (admin)
│   │   └── dashboard/route.ts      # GET analytics (admin)
│   │
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── equipment/page.tsx          # Borrower: browse & request
│   ├── my-rentals/page.tsx         # Borrower: rental history
│   ├── dashboard/
│   │   ├── page.tsx                # Admin: analytics dashboard
│   │   ├── equipment/page.tsx      # Admin: manage equipment
│   │   ├── rentals/page.tsx        # Admin: manage rentals
│   │   └── users/page.tsx          # Admin: view users
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── AppShell.tsx            # Auth guard + layout wrapper
│   └── ui/
│       └── Badge.tsx               # Status and condition badges
│
├── lib/
│   ├── db.ts                       # MongoDB connection (cached)
│   ├── auth.ts                     # JWT sign/verify utilities
│   ├── time.ts                     # UTC time helpers
│   ├── api.ts                      # Client-side fetch wrapper
│   └── AuthContext.tsx             # React auth context
│
└── models/
    ├── User.ts
    ├── Equipment.ts
    └── Rental.ts
```

---

## Business Rules Implemented

### Double-Booking Prevention

When a rental request is created, the system checks for existing **Approved** rentals with overlapping dates and no return:

```
existing.startDate <= newEndDate AND existing.endDate >= newStartDate AND returnDate == null
```

If found → request is **rejected**.

### Availability Logic

Equipment is **unavailable** only when there is an Approved rental where:
- `currentDate >= startDate`
- `currentDate <= endDate`
- `returnDate == null`

All other cases → **Available**.

### Late Return Detection

Any time rentals are fetched, the system runs:

```js
Rental.updateMany(
  { status: 'Approved', endDate: { $lt: now }, returnDate: null },
  { $set: { status: 'Late' } }
)
```

No cron job needed — automatic on every request.

### Early Return

When a borrower or admin marks a rental as returned:
- `returnDate` = server UTC time
- `status` = `'Returned'`
- Equipment becomes **immediately available** for new bookings

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | None | Register borrower |
| POST | /api/auth/login | None | Login |
| GET | /api/auth/me | Any | Get current user |
| DELETE | /api/auth/me | Any | Logout |

### Equipment
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/equipment | Any | List all with availability |
| POST | /api/equipment | Admin | Create equipment |
| GET | /api/equipment/:id | Any | Get single with availability |
| PATCH | /api/equipment/:id | Admin | Update equipment |
| DELETE | /api/equipment/:id | Admin | Delete equipment |

### Rentals
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/rentals | Any | List (admin=all, borrower=own) |
| POST | /api/rentals | Any | Submit rental request |
| GET | /api/rentals/:id | Owner/Admin | Get single rental |
| PATCH | /api/rentals/:id | Owner/Admin | Actions: approve, reject, return, cancel |

### Dashboard & Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/dashboard | Admin | All analytics |
| GET | /api/users | Admin | All users |

---

## Rental Status Flow

```
Requested
   ├── approve (Admin) → Approved
   │       ├── return (Admin/Borrower) → Returned
   │       └── [auto if overdue] → Late
   │               └── return → Returned
   └── reject/cancel → Cancelled
```

---

## Deployment to Azure

1. Create an **Azure App Service** (Node.js 20 LTS)
2. Set Application Settings (env vars):
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
3. Set **Startup Command**: `npm start`
4. Push code via GitHub Actions or Azure CLI:

```bash
az webapp up --name rentalhub --resource-group myRG --runtime NODE:20-lts
```

5. Ensure build runs: `npm run build && npm start`

### Azure MongoDB (Optional)

Use **Azure Cosmos DB for MongoDB** for a fully Azure-native stack:
- Enable the MongoDB compatibility API
- Use the connection string provided

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret for JWT signing (32+ chars) |
| `NODE_ENV` | ✅ | `development` or `production` |

---

## Status Badge Reference

| Status | Color | Description |
|---|---|---|
| Available | 🟢 Green | Ready to rent |
| Rented | 🔴 Red | Currently checked out |
| Late | 🟠 Orange | Past due, not returned |
| Maintenance | ⚫ Gray | Under maintenance |
| Requested | 🟣 Purple | Awaiting admin approval |
| Approved | 🔵 Blue | Confirmed rental |
| Returned | 🟢 Green | Completed rental |
| Cancelled | ⚫ Gray | Cancelled/Rejected |
# rentalhub_backend
