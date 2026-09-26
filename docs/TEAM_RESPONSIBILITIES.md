# StockSense - Team Work Division & Git Workflow

## 1. Team Allocation (4 Members)

| Member | Focus | Assigned Modules & Files | Git Feature Branch |
| :--- | :--- | :--- | :--- |
| **Member 1 (Backend Core / You)** | Stock Ledger & Operations Engine | `server/src/modules/operations/`<br>`server/src/modules/adjustments/`<br>`server/src/modules/ledger/`<br>`server/src/models/StockOperation.js`<br>`server/src/models/StockQuant.js`<br>`server/src/models/StockLedger.js` | `feat/be-stock-engine` |
| **Member 2 (Backend Auth & Services)** | Auth, Users, Products & KPIs | `server/src/modules/auth/`<br>`server/src/modules/products/`<br>`server/src/modules/dashboard/`<br>`server/src/modules/warehouse/`<br>`server/src/models/User.js`<br>`server/src/models/Product.js` | `feat/be-auth-products` |
| **Member 3 (Frontend Lead / App Shell)** | Auth UI, Layout & Dashboard KPIs | `client/src/pages/auth/`<br>`client/src/pages/dashboard/`<br>`client/src/components/layout/`<br>`client/src/api/` | `feat/fe-shell-dashboard` |
| **Member 4 (Frontend Operations)** | Inventory Workflows & Forms | `client/src/pages/products/`<br>`client/src/pages/operations/`<br>`client/src/pages/settings/` | `feat/fe-operations-workflows` |

---

## 2. Git Workflow Rules

1. **Clone & Setup Branch**:
   ```bash
   git clone <repo-url>
   git checkout -b <your-branch-name>
   ```
2. **Never push directly to `main`**:
   - Always open a Pull Request (PR) to merge into `main`.
3. **Local Environment Setup**:
   - Copy `.env.example` in `server/` to `server/.env`.
   - Copy `.env.example` in `client/` to `client/.env`.
4. **Commits**:
   - Use clear commit messages like `feat(operations): add receipt validation transaction` or `fix(auth): fix OTP expiry check`.
