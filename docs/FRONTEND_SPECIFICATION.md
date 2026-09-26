# STOCKSENSE — COMPLETE FRONTEND SPECIFICATION & REPLICATION GUIDE

> **How to use this file:**
> Copy and paste the entire content of this prompt into any AI coding assistant (ChatGPT, Claude, Cursor, Gemini, etc.) to recreate the exact same StockSense frontend.
> You can also attach the accompanying archive: `stocksense_frontend.zip` which contains the entire `src/` codebase.

---

## 1. PROJECT OVERVIEW & ARCHITECTURE

**Product Name:** STOCKSENSE  
**Application Type:** Industrial Inventory Management System (IMS) / Logistics ERP  
**Target Roles:**
1. **Inventory Manager:** Alex Vance (Full Corporate Scope, Master Data, Reordering Rules, Warehouse Configuration, Adjustment Validations)
2. **Warehouse Staff:** Marcus Miller (Floor Execution at Main Central Hub, Receipts Intake, Deliveries Picking & Packing, Internal Moves, Cycle Count Submissions)

**Tech Stack:**
- **Framework:** Next.js (App Router, Turbopack, React 19)
- **Styling:** Tailwind CSS + Vanilla CSS Variables
- **Icons:** `lucide-react`
- **Animations:** `framer-motion` (clean 150ms transitions, strictly no AI glowing/pulsing animations)
- **Typography:**
  - **Primary UI Font:** `IBM Plex Sans` (Navigation, forms, tables, body text, badges)
  - **Display / Headings:** `Space Grotesk` (Page titles, KPI values, inventory quantities)
- **State Management:** React Context API with LocalStorage persistence:
  - `AuthContext.tsx`: Authentication, JWT session simulation, Role switching, OTP password reset
  - `InventoryContext.tsx`: Master products, warehouses, locations, receipts, delivery orders, internal transfers, adjustments (with staff pending approval & manager validation workflow), stock ledger

---

## 2. DESIGN SYSTEM & VISUAL RULES

### Strict Aesthetic Principles:
- **Style:** Industrial software, German warehouse logistics terminal, high-density precision layout.
- **NOT an AI chatbot, NOT generic SaaS:**
  - Zero glowing dots, zero pulse animations (`animate-pulse` forbidden on status indicators).
  - Zero gradient badges, zero decorative sparkles.
  - Zero AI buzzwords ("smart", "intelligent", "real-time sync").
- **Top Status Bar:**
  - Simple neutral `[ Operational ]` badge.
- **Movement Badges:**
  - Plain text badges without circular dots:
    - `Receipt` (Emerald subtle text)
    - `Transfer` (Slate/blue-gray text)
    - `Delivery` (Orange text)
    - `Adjustment` (Amber text)
- **Movement Icons:**
  - Direct 16px Lucide icons with consistent stroke weight (`strokeWidth={1.75}`) placed directly next to text, **never inside colored circular frames**:
    - Receipt: `ArrowDownToLine`
    - Delivery: `ArrowUpFromLine`
    - Internal Transfer: `ArrowRightLeft`
    - Adjustment: `ClipboardPenLine`
- **Ledger Navigation:**
  - Standard link: `View Stock Ledger →`

---

## 3. FILE & FOLDER STRUCTURE

```
src/
├── app/
│   ├── globals.css              # Font definitions, theme variables, custom scrollbars
│   ├── layout.tsx               # Root layout importing Space Grotesk & IBM Plex Sans
│   └── page.tsx                 # Master view orchestrator, tab router, 403 RBAC route guards
├── context/
│   ├── AuthContext.tsx          # User session, login, role toggle, OTP reset
│   └── InventoryContext.tsx     # Full IMS state machine, scoped staff queries, mutations
├── types/
│   └── inventory.ts             # Complete TypeScript data model & types
├── lib/
│   ├── initialData.ts           # Realistic industrial seed data (warehouses, locations, products, ledger)
│   └── utils.ts                 # Class merging (cn), formatDateTime, formatNumber
└── components/
    ├── layout/
    │   ├── AppHeader.tsx        # Top bar, warehouse selector (locked for staff), alerts
    │   └── AppSidebar.tsx       # Industrial sidebar with filtered navigation groups by role
    ├── auth/
    │   └── AuthView.tsx         # Multi-mode login, registration, OTP reset terminal
    ├── dashboard/
    │   ├── DashboardView.tsx    # Manager Dashboard (telemetry, calibrated meter, heatmap, movements)
    │   └── StaffDashboardView.tsx # Staff Dashboard (Today's Work Queue, Operations Timeline, Scoped Alerts)
    ├── products/
    │   ├── ProductsView.tsx     # Master inventory table, search, category filter, stock by location
    │   ├── CategoriesView.tsx   # Material categories, hierarchy, product counters
    │   └── ProductDetailModal.tsx # Inspection drawer with barcode display and location breakdown
    ├── operations/
    │   ├── ReceiptsView.tsx     # Inbound freight PO receipts, receiving bay verification, auto-restock
    │   ├── DeliveryOrdersView.tsx # Outbound dispatch, 4-stage pipeline (Draft -> Pick -> Pack -> Done)
    │   ├── InternalTransfersView.tsx # Rack-to-rack / inter-facility relocation without delta to company balance
    │   ├── AdjustmentsView.tsx  # Cycle count discrepancies (Staff submits 'waiting' -> Manager validates)
    │   └── StockLedgerView.tsx  # Immutable chronological stock ledger, CSV export, filter by operation
    ├── rules/
    │   └── ReorderingRulesView.tsx # Min-Max safety stock triggers, automated PO suggestions
    ├── settings/
    │   └── WarehouseSettingsView.tsx # Multi-warehouse hierarchy, bin/shelf/bay layout builder
    ├── profile/
    │   └── ProfileView.tsx      # Operator attributes, assigned facility badge, instant role switcher
    └── common/
        ├── AccessRestrictedView.tsx # HTTP 403 Forbidden barrier for staff trying to reach manager routes
        ├── Badge.tsx            # Industrial semantic status badges
        ├── Modal.tsx            # Clean accessible dialog modal
        ├── BarcodeScannerModal.tsx # Simulated optical 1D/2D RF barcode gun
        ├── CapacityMeter.tsx    # Semi-circular calibrated warehouse capacity dial & facility heatmap
        ├── QuickActionModal.tsx # Fast operational shortcut menu (Receipt, Delivery, Transfer, Count)
        └── StockMovementArrow.tsx # Visual directional flow vector (Source Location -> Destination Location)
```

---

## 4. CORE DATA MODELS (`src/types/inventory.ts`)

```typescript
export type UserRole = 'inventory_manager' | 'warehouse_staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  warehouseId?: string; // 'all' for manager, 'wh-main' for staff
  assignedWarehouseName?: string;
}

export type OperationType = 'Receipt' | 'Delivery' | 'Internal Transfer' | 'Adjustment';
export type OperationStatus = 'draft' | 'waiting' | 'ready' | 'done' | 'cancelled';
export type DeliveryStage = 'draft' | 'pick' | 'pack' | 'validate' | 'done';
export type AdjustmentReason = 'Damaged' | 'Inventory Count / Cycle' | 'Lost Goods' | 'Found Goods' | 'Calibration Error' | 'Theft';

export interface WarehouseLocation {
  id: string;
  warehouseId: string;
  name: string;
  code: string;
  type: 'rack' | 'receiving' | 'staging' | 'floor' | 'shipping';
  capacity?: number;
  currentOccupancy?: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  locations: WarehouseLocation[];
}

export interface LocationStock {
  locationId: string;
  locationName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  reorderPoint: number;
  maxStock: number;
  locationStock: LocationStock[];
  description?: string;
  supplierName?: string;
}

export interface StockLedgerEntry {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  sku: string;
  operationType: OperationType;
  referenceNumber: string;
  sourceLocationName: string;
  destinationLocationName: string;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  quantityDelta: number;
  unitOfMeasure: string;
  newBalance: number;
  operatorName: string;
  notes?: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  createdAt: string;
  createdByName: string;
  status: OperationStatus; // 'waiting' for staff submission, 'done' after manager validation
  reason: AdjustmentReason;
  notes?: string;
  validatedByName?: string;
  validatedAt?: string;
  items: {
    productId: string;
    productName: string;
    locationId: string;
    locationName: string;
    recordedQuantity: number;
    physicalQuantity: number;
    difference: number;
    unitOfMeasure: string;
  }[];
}
```

---

## 5. COMPLETE ROLE-BASED ACCESS CONTROL (RBAC) LOGIC

### Manager Workflow (`Alex Vance`):
- Navigation includes: `OVERVIEW`, `MASTER DATA` (Products, Categories, Reordering Rules), `OPERATIONS` (Receipts, Deliveries, Transfers, Adjustments, Ledger), `SETTINGS` (Warehouse), `PROFILE`.
- Warehouse Switcher enabled for all facilities.
- Has authority to approve pending floor counts submitted by warehouse staff via `Validate & Apply`.

### Staff Workflow (`Marcus Miller` assigned to `wh-main`):
- Navigation restricted to: `OVERVIEW`, `OPERATIONS` (Receipts, Deliveries, Transfers, Adjustments, Ledger), `PROFILE`.
- Master Data & Warehouse Settings hidden in navigation and blocked at route level.
- Direct URL / param manipulation (e.g. `?tab=products`) yields `AccessRestrictedView` (HTTP 403 Forbidden).
- Facility locked to `Main Central Hub [WH-MAIN]`.
- Physical cycle counts submitted by staff receive `status: 'waiting'` ("Pending Approval") without modifying live stock balances until an Inventory Manager validates them.
- Staff Overview displays the dedicated `StaffDashboardView` with Today's Work Queue and Today's Operations Timeline.

---

## 6. INSTRUCTIONS FOR THE OTHER AI

When recreating this frontend:
1. Initialize a Next.js App Router project with Tailwind CSS.
2. Install `lucide-react`, `framer-motion`, and `canvas-confetti`.
3. Set font families in `globals.css` to `Space Grotesk` (display) and `IBM Plex Sans` (body/UI).
4. Implement the exact layout: dark/light responsive industrial theme with left sidebar, sticky header with warehouse selector, and tabbed view renderer in `page.tsx`.
5. Maintain strict industrial styling: crisp border radii (`rounded-lg`, `rounded-xl`), neutral slate palettes (`slate-50` through `slate-950`), semantic status badges, and precise monospace numeric indicators.
