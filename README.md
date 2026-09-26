# StockSense - Modular Inventory Management System (MERN)

StockSense is a modular, real-time inventory management system designed to digitize and streamline stock-related operations, replacing manual registers and spreadsheets with double-entry stock movement tracking.

---

## 🏗 Project Architecture

```text
odoo2/
├── docs/                     # Shared documentation & API contracts
│   ├── API_CONTRACT.md       # REST API specs for BE & FE sync
│   └── TEAM_RESPONSIBILITIES.md # 4-member task breakdown & branch policy
├── server/                   # Backend API (Node.js, Express, MongoDB, Mongoose)
│   ├── src/
│   │   ├── config/           # Database configuration
│   │   ├── middlewares/      # JWT auth guard, error handler
│   │   ├── models/           # Mongoose schemas (User, Product, StockOperation, StockLedger, etc.)
│   │   ├── modules/          # Modular feature controllers & routes
│   │   │   ├── auth/         # Login, Register, OTP password reset
│   │   │   ├── products/     # Product catalog & stock rules
│   │   │   ├── operations/   # Receipts, Deliveries, Internal Transfers
│   │   │   ├── adjustments/  # Physical count adjustments
│   │   │   ├── ledger/       # Immutable move audit history
│   │   │   ├── dashboard/    # KPI metrics calculation
│   │   │   └── warehouse/    # Multi-warehouse & locations
│   │   ├── app.js            # Express app configuration
│   │   └── server.js         # Server bootstrap
│   ├── .env.example
│   └── package.json
└── client/                   # Frontend SPA (React, Vite, Tailwind CSS)
    ├── src/
    │   ├── api/              # Axios instance & interceptors
    │   ├── components/       # Layouts, Sidebar, Navbar
    │   ├── pages/            # Dashboard, Products, Operations, Auth
    │   ├── App.jsx           # Router configuration
    │   └── main.jsx
    ├── .env.example
    └── package.json
```

---

## 👥 Team Work Allocation (4 Developers)

1. **Member 1 (Backend Core & Stock Engine)**:
   - Double-entry stock logic (`StockQuant`, `StockLedger`, `StockOperation`)
   - Receipts, Deliveries, Internal Transfers & Stock Adjustments validation
   - Working Directory: `server/src/modules/operations/`, `adjustments/`, `ledger/`
   
2. **Member 2 (Backend Auth & Catalog)**:
   - Authentication (JWT, OTP password reset)
   - Product Catalog CRUD, Categories, Reorder rules
   - Dashboard KPI aggregation APIs
   - Working Directory: `server/src/modules/auth/`, `products/`, `dashboard/`

3. **Member 3 (Frontend Shell & Dashboard)**:
   - App layout, Responsive Sidebar, Navbar
   - Auth views (Login, Register, OTP Reset)
   - Dashboard with KPI cards & dynamic filter controls
   - Working Directory: `client/src/pages/auth/`, `dashboard/`, `components/layout/`

4. **Member 4 (Frontend Operations)**:
   - Products table with SKU search & low-stock badges
   - Receipts, Deliveries & Transfers workflow views
   - Physical count adjustment interface & Stock Ledger view
   - Working Directory: `client/src/pages/products/`, `operations/`, `settings/`

---

## 🚀 Quickstart for Team Members

### 1. Clone the repository
```bash
git clone <repository_url>
cd stocksense
```

### 2. Configure Environment Files
**Server (`server/.env`):**
```bash
cd server
copy .env.example .env
```
*(Ensure MongoDB is running locally or specify your MongoDB Atlas URI in `MONGO_URI`)*

**Client (`client/.env`):**
```bash
cd ../client
copy .env.example .env
```

### 3. Install Dependencies
From the root directory:
```bash
cd ..
npm run install:all
```
*Or install individually in `server/` and `client/`:*
```bash
cd server && npm install
cd ../client && npm install
```

### 4. Run Development Servers
- **Backend API:** `cd server && npm run dev` (Runs on `http://localhost:5000`)
- **Frontend App:** `cd client && npm run dev` (Runs on `http://localhost:5173`)
