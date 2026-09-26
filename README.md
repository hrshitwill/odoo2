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
✨ Key Features
🔐 Authentication and OTP password reset
📊 Real-time inventory dashboard
📦 Product management
🚚 Incoming and outgoing stock management
🔄 Internal stock transfers
🧮 Inventory adjustments
📒 Complete stock ledger
🚨 Low-stock alerts
🏢 Multi-warehouse support
🔎 SKU search
🎯 Smart filtering
👤 User profile management
🎯 Expected Outcome

StockSense aims to provide a centralized inventory platform that helps businesses:

Reduce manual inventory work
Minimize stock discrepancies
Track every stock movement
Improve warehouse visibility
Prevent stock shortages
Manage multiple warehouses
Maintain an accurate inventory history
🎨 UI/UX Mockup

The application interface and workflow can be viewed in the project mockup:

Excalidraw Mockup:
https://link.excalidraw.com/l/65VNwvy7c4X/3ENvQFu9o8R

🚀 Future Enhancements

Potential future improvements include:

Barcode/QR code scanning
Supplier management
Purchase order integration
Sales order integration
Automated purchase suggestions
Advanced inventory analytics
Export reports to Excel/PDF
Role-based access control
Email/SMS notifications
Audit logs
Mobile application
📌 Project Summary

StockSense is a centralized Inventory Management System that tracks the complete lifecycle of inventory — from receiving goods from vendors to storing, transferring, delivering, and adjusting stock.

The core principle is:

Every Stock Movement
        ↓
      Update
        ↓
   Stock Quantity
        ↓
   Stock Ledger
        ↓
 Complete History

This provides businesses with accurate, transparent, and real-time visibility into their inventory.
