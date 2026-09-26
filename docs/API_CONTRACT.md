# StockSense - API Contract & Endpoints

This document serves as the interface agreement between the backend and frontend developers.

All API routes are prefixed with `/api`.
Authenticated routes require header: `Authorization: Bearer <token>`.

---

## 1. Authentication (`/api/auth`)
- `POST /register`: `{ name, email, password, role }` -> `{ success, token, user }`
- `POST /login`: `{ email, password }` -> `{ success, token, user }`
- `POST /forgot-password`: `{ email }` -> `{ success, message, debugOtp? }`
- `POST /reset-password`: `{ email, otp, newPassword }` -> `{ success, message }`
- `GET /me`: Authenticated user profile

## 2. Products (`/api/products`)
- `GET /`: Query params: `search`, `category`, `lowStock` (true/false) -> List of products with calculated `totalStock` and `isLowStock` boolean.
- `GET /:id`: Details with `stockPerLocation` array.
- `POST /`: `{ name, sku, category, uom, minStockRule, maxStockRule }`
- `PUT /:id`: Update fields
- `DELETE /:id`: Remove product

## 3. Stock Operations (`/api/operations`)
Covers Receipts, Deliveries, and Transfers:
- `GET /`: Query params: `type` (`RECEIPT` | `DELIVERY` | `INTERNAL`), `status` (`DRAFT` | `WAITING` | `READY` | `DONE` | `CANCELED`), `location`.
- `GET /:id`: Detailed document with items array.
- `POST /`: Create operation:
  ```json
  {
    "type": "RECEIPT", // or DELIVERY, INTERNAL
    "partner": "Steel Suppliers Ltd",
    "sourceLocation": "<location_id>",
    "destLocation": "<location_id>",
    "items": [
      { "product": "<product_id>", "demandQty": 50 }
    ],
    "notes": "Incoming order #123"
  }
  ```
- `POST /:id/validate`: Executes stock movement!
  - If Receipt: increases internal location stock.
  - If Delivery: decreases internal location stock.
  - If Transfer: decreases source location stock, increases destination location stock.
  - Creates immutable `StockLedger` audit record.
- `POST /:id/cancel`: Cancels draft/waiting operation.

## 4. Inventory Adjustments (`/api/adjustments`)
- `POST /`:
  ```json
  {
    "productId": "<product_id>",
    "locationId": "<location_id>",
    "countedQty": 97,
    "reason": "3 kg steel damaged"
  }
  ```
  - Calculates delta (`countedQty - recordedQty`), sets on-hand stock to `countedQty`, and logs entry in `StockLedger`.

## 5. Move History / Stock Ledger (`/api/ledger`)
- `GET /`: Query params: `productId`, `locationId`, `page`, `limit`
  - Returns paginated move entries with timestamps, reference, product, source, dest, qty, and user.

## 6. Dashboard KPIs (`/api/dashboard/kpis`)
- `GET /kpis`: Returns live metrics:
  ```json
  {
    "totalProducts": 142,
    "lowStockItems": 8,
    "outOfStockItems": 2,
    "pendingReceipts": 5,
    "pendingDeliveries": 12,
    "scheduledTransfers": 3
  }
  ```

## 7. Warehouse & Locations (`/api/warehouses`)
- `GET /`: Warehouses with nested locations
- `POST /`: Create warehouse
- `GET /locations`: All locations (filter by `type=INTERNAL` etc.)
- `POST /locations`: Create location
