# StockSense — Core Features Specification

## 1. Overview

Build the core Inventory Management System functionality for **StockSense**.

The core system must digitize stock-related operations and provide a centralized system for managing:

* Products
* Product Categories
* Warehouses / Locations
* Incoming Stock / Receipts
* Outgoing Stock / Delivery Orders
* Internal Transfers
* Stock Adjustments
* Stock Ledger
* Inventory Dashboard
* Inventory Alerts
* Search and Filters

The authentication module is implemented separately and provides the authenticated user and role.

---

# 2. Core Objective

The system must maintain a reliable representation of inventory across warehouses and locations.

Every stock-changing operation must update inventory and create a corresponding ledger entry.

The fundamental rule is:

```text
Stock changes
      ↓
Inventory updated
      ↓
Stock Ledger entry created
      ↓
Dashboard reflects latest state
```

No stock quantity should be changed directly without recording the operation that caused the change.

---

# 3. User Roles

The authentication system provides:

```text
inventory_manager
warehouse_staff
```

Core features should use the authenticated user's identity and role.

### Inventory Manager

Can manage:

* Products
* Categories
* Warehouses
* Receipts
* Deliveries
* Internal Transfers
* Stock Adjustments
* Inventory Dashboard
* Stock Ledger

### Warehouse Staff

Can perform operational inventory activities such as:

* Receiving stock
* Picking items
* Moving stock
* Shelving
* Counting stock
* Viewing relevant inventory information

Role restrictions should be implemented through reusable authorization middleware.

---

# 4. Core Data Model

The system should use the following main entities:

```text
User
Product
Category
Warehouse
Location
Receipt
ReceiptItem
Delivery
DeliveryItem
InternalTransfer
TransferItem
StockAdjustment
StockLedger
```

---

# 5. Product Management

Products are the primary inventory items.

The problem statement requires products to support:

* Name
* SKU / Code
* Category
* Unit of Measure
* Initial Stock (optional) 

## Product Fields

```text
Product
├── id
├── name
├── sku
├── categoryId
├── unitOfMeasure
├── description
├── active
├── createdAt
└── updatedAt
```

## Requirements

Users must be able to:

* Create products
* View products
* Update products
* Search products
* Filter products
* View stock availability
* View product category
* View unit of measure

SKU must be unique.

---

# 6. Product Categories

Create a category system.

```text
Category
├── id
├── name
├── description
└── createdAt
```

Users should be able to:

* Create categories
* View categories
* Update categories
* Filter products by category

The problem statement explicitly requires product categories. 

---

# 7. Warehouse Management

StockStocks must support multiple warehouses.

The problem statement requires:

```text
Multi-warehouse support
```



## Warehouse

```text
Warehouse
├── id
├── name
├── code
├── address
├── active
├── createdAt
└── updatedAt
```

Example:

```text
Main Warehouse
Production Warehouse
Warehouse 2
```

---

# 8. Locations

A warehouse can contain multiple internal locations.

Example:

```text
Main Warehouse
│
├── Rack A
├── Rack B
├── Production Floor
└── Storage Area
```

Location model:

```text
Location
├── id
├── warehouseId
├── name
├── code
└── active
```

This enables stock to be tracked at warehouse/location level.

---

# 9. Inventory Model

Inventory must be tracked by:

```text
Product
+
Warehouse
+
Location
```

Example:

```text
Steel Rods
Main Warehouse
Rack A
Quantity: 100
```

Suggested model:

```text
Inventory
├── id
├── productId
├── warehouseId
├── locationId
└── quantity
```

A unique combination of:

```text
productId + warehouseId + locationId
```

must identify one inventory record.

---

# 10. Stock Rules

The system must maintain accurate quantities.

### Incoming Stock

```text
Current Stock + Received Quantity
```

### Outgoing Stock

```text
Current Stock - Delivered Quantity
```

### Internal Transfer

```text
Source Location - Quantity
Destination Location + Quantity
```

### Adjustment

```text
Adjusted Quantity = Physical Count
```

The resulting difference must be recorded.

---

# 11. Receipts — Incoming Stock

Receipts represent goods arriving from vendors.

The problem statement defines the process as:

1. Create receipt.
2. Add supplier and products.
3. Enter quantities received.
4. Validate.
5. Increase stock automatically. 

## Receipt Model

```text
Receipt
├── id
├── receiptNumber
├── supplier
├── warehouseId
├── locationId
├── status
├── createdBy
├── validatedBy
├── createdAt
└── validatedAt
```

## Receipt Item

```text
ReceiptItem
├── id
├── receiptId
├── productId
├── quantity
└── unitOfMeasure
```

---

# 12. Receipt Status

Use:

```text
Draft
Waiting
Ready
Done
Canceled
```

These statuses are specified in the dashboard filtering requirements. 

Suggested lifecycle:

```text
Draft
  ↓
Ready
  ↓
Done
```

Canceled receipts must not modify stock.

---

# 13. Receipt Validation

When a receipt is validated:

```text
Receipt
   ↓
Validate
   ↓
For each item
   ↓
Increase inventory
   ↓
Create Stock Ledger entry
   ↓
Mark Receipt = Done
```

Example:

```text
Receive 50 Steel Rods

Before:
Steel Rods = 100

Receipt:
+50

After:
Steel Rods = 150
```

The problem statement gives the same stock-increase behavior. 

---

# 14. Delivery Orders — Outgoing Stock

Delivery Orders represent stock leaving the warehouse for customer shipment.

The required process is:

1. Pick items.
2. Pack items.
3. Validate.
4. Decrease stock automatically. 

## Delivery Model

```text
Delivery
├── id
├── deliveryNumber
├── customer
├── warehouseId
├── locationId
├── status
├── createdBy
├── validatedBy
├── createdAt
└── validatedAt
```

## Delivery Item

```text
DeliveryItem
├── id
├── deliveryId
├── productId
└── quantity
```

---

# 15. Delivery Status

Use:

```text
Draft
Waiting
Ready
Done
Canceled
```

Suggested flow:

```text
Draft
 ↓
Waiting
 ↓
Ready
 ↓
Done
```

Canceled deliveries must not reduce stock.

---

# 16. Stock Validation for Delivery

Before validating a delivery:

```text
Requested Quantity <= Available Quantity
```

If insufficient stock:

```text
Do not validate
Do not reduce inventory
Return error
```

Example:

```text
Available = 20
Requested = 25

Result:

❌ Insufficient stock
```

---

# 17. Internal Transfers

Internal transfers move stock between locations.

Examples specified in the problem statement include:

```text
Main Warehouse → Production Floor
Rack A → Rack B
Warehouse 1 → Warehouse 2
```

Each movement must be logged in the ledger. 

## Transfer Model

```text
InternalTransfer
├── id
├── transferNumber
├── sourceWarehouseId
├── sourceLocationId
├── destinationWarehouseId
├── destinationLocationId
├── status
├── createdBy
├── validatedBy
├── createdAt
└── validatedAt
```

## Transfer Item

```text
TransferItem
├── id
├── transferId
├── productId
└── quantity
```

---

# 18. Transfer Validation

When validated:

```text
Source
  ↓
Decrease quantity

Destination
  ↓
Increase quantity

Stock Ledger
  ↓
Create transfer record
```

Total company stock must remain unchanged.

Example:

```text
Rack A = 100
Rack B = 20

Transfer 30:

Rack A = 70
Rack B = 50

Total = 120
```

---

# 19. Stock Adjustments

Stock adjustments correct differences between recorded and physical stock.

The problem statement defines:

1. Select product/location.
2. Enter counted quantity.
3. System updates stock.
4. System logs the adjustment. 

## Adjustment Model

```text
StockAdjustment
├── id
├── adjustmentNumber
├── productId
├── warehouseId
├── locationId
├── systemQuantity
├── countedQuantity
├── difference
├── reason
├── createdBy
├── status
└── createdAt
```

---

# 20. Adjustment Calculation

```text
Difference =
Counted Quantity - System Quantity
```

Example:

```text
System Quantity = 100
Physical Count = 97

Difference = -3
```

Result:

```text
Inventory = 97
Ledger = -3 adjustment
```

The problem statement uses damaged stock as an example where stock decreases by 3. 

---

# 21. Stock Ledger

The Stock Ledger is the central audit trail for inventory movements.

Every stock-changing operation must create a ledger entry.

Ledger events:

```text
Receipt
Delivery
Internal Transfer
Stock Adjustment
```

## StockLedger

```text
StockLedger
├── id
├── productId
├── warehouseId
├── locationId
├── operationType
├── referenceId
├── quantityBefore
├── quantityChange
├── quantityAfter
├── createdBy
└── createdAt
```

Operation types:

```text
RECEIPT
DELIVERY
TRANSFER_IN
TRANSFER_OUT
ADJUSTMENT
```

---

# 22. Ledger Example

Suppose:

```text
Initial Stock = 100
```

Receive 50:

```text
Before = 100
Change = +50
After = 150
```

Transfer 20:

```text
Source:
Before = 150
Change = -20
After = 130

Destination:
Before = 0
Change = +20
After = 20
```

Delivery 10:

```text
Before = 130
Change = -10
After = 120
```

Adjustment -3:

```text
Before = 120
Change = -3
After = 117
```

The ledger should make this complete history queryable.

---

# 23. Inventory Dashboard

The landing page after authentication should be the Inventory Dashboard.

The problem statement requires these KPIs:

```text
Total Products in Stock
Low Stock / Out of Stock Items
Pending Receipts
Pending Deliveries
Internal Transfers Scheduled
```



---

# 24. Dashboard KPI APIs

Create an endpoint:

```http
GET /api/dashboard/summary
```

Response:

```json
{
  "totalProducts": 120,
  "lowStockItems": 8,
  "outOfStockItems": 3,
  "pendingReceipts": 12,
  "pendingDeliveries": 7,
  "scheduledTransfers": 4
}
```

Numbers must be calculated from the current database state.

Do not hardcode dashboard values.

---

# 25. Low Stock

Products should support a reorder threshold.

Example:

```text
Product:
Steel Rod

Current:
8

Reorder Level:
10
```

Result:

```text
LOW STOCK
```

If:

```text
Current Stock = 0
```

Result:

```text
OUT OF STOCK
```

The problem statement requires alerts for low stock and reordering rules.  

---

# 26. Reordering Rules

Product inventory can have:

```text
reorderLevel
reorderQuantity
```

Example:

```text
Product: Chairs
Reorder Level: 20
Reorder Quantity: 100
```

When stock falls below the reorder level:

```text
Low Stock Alert
```

---

# 27. Dashboard Filters

The dashboard must support dynamic filters.

Required filters:

### Document Type

```text
Receipts
Delivery
Internal
Adjustments
```

### Status

```text
Draft
Waiting
Ready
Done
Canceled
```

### Warehouse / Location

Filter inventory operations by warehouse or location.

### Product Category

Filter operations/products by category.

These filters are explicitly specified in the problem statement. 

---

# 28. Search

Implement SKU/product search.

Search should support:

```text
Product Name
SKU / Code
```

Example:

```text
Search:
STEEL-001
```

Returns:

```text
Steel Rods
SKU: STEEL-001
```

The problem statement specifically requires SKU search and smart filters. 

---

# 29. Navigation

The authenticated application should provide:

```text
Dashboard
Products
Operations
   ├── Receipts
   ├── Delivery Orders
   ├── Inventory Adjustments
   └── Move History

Settings
   └── Warehouse

Profile
Logout
```

This follows the navigation specified in the problem statement. 

---

# 30. Products Page

Display:

```text
Products

[ Search SKU / Product ]

[ Category Filter ]

[ Add Product ]
```

Table:

```text
Product
SKU
Category
Unit
Stock
Location
Status
Actions
```

Actions:

```text
View
Edit
```

---

# 31. Product Creation

Form:

```text
Product Name
SKU / Code
Category
Unit of Measure
Initial Stock
Reorder Level
Reorder Quantity
```

On creation:

```text
Product Created
      ↓
If Initial Stock > 0
      ↓
Create Inventory Record
      ↓
Create Initial Stock Ledger Entry
```

---

# 32. Receipts Page

Display:

```text
Receipts

[ Create Receipt ]

Receipt No.
Supplier
Warehouse
Items
Status
Created Date
Actions
```

Actions:

```text
View
Edit
Validate
Cancel
```

---

# 33. Delivery Page

Display:

```text
Delivery Orders

[ Create Delivery ]

Delivery No.
Customer
Warehouse
Items
Status
Created Date
Actions
```

Actions:

```text
View
Edit
Validate
Cancel
```

---

# 34. Internal Transfer Page

Display:

```text
Internal Transfers

[ Create Transfer ]

Transfer No.
Source
Destination
Products
Status
Created Date
Actions
```

Actions:

```text
View
Edit
Validate
Cancel
```

---

# 35. Stock Adjustment Page

Display:

```text
Stock Adjustments

[ Create Adjustment ]

Product
Warehouse
Location
System Quantity
Counted Quantity
Difference
Reason
Created By
Date
```

---

# 36. Move History

Move History should provide an audit view of inventory movements.

Display:

```text
Date
Product
Operation
Reference
Source
Destination
Quantity
User
```

Example:

```text
26 Sep 2026
Steel Rod
Internal Transfer
TR-0012
Rack A → Rack B
30
Adithya
```

---

# 37. Database Consistency

Stock-changing operations must be atomic.

For example, when validating a receipt:

```text
BEGIN TRANSACTION

Update Inventory

Create Ledger Entry

Update Receipt Status

COMMIT
```

If any operation fails:

```text
ROLLBACK
```

This prevents situations where inventory changes but the ledger does not.

Use MongoDB transactions where supported by the deployment configuration.

---

# 38. API Structure

Recommended routes:

```text
/api/products
/api/categories
/api/warehouses
/api/locations

/api/receipts
/api/receipts/:id/validate

/api/deliveries
/api/deliveries/:id/validate

/api/transfers
/api/transfers/:id/validate

/api/adjustments

/api/inventory
/api/ledger

/api/dashboard
```

---

# 39. Product APIs

```http
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

Query parameters:

```text
search
category
warehouse
location
status
page
limit
```

---

# 40. Receipt APIs

```http
GET    /api/receipts
GET    /api/receipts/:id
POST   /api/receipts
PUT    /api/receipts/:id
POST   /api/receipts/:id/validate
POST   /api/receipts/:id/cancel
```

---

# 41. Delivery APIs

```http
GET    /api/deliveries
GET    /api/deliveries/:id
POST   /api/deliveries
PUT    /api/deliveries/:id
POST   /api/deliveries/:id/validate
POST   /api/deliveries/:id/cancel
```

---

# 42. Transfer APIs

```http
GET    /api/transfers
GET    /api/transfers/:id
POST   /api/transfers
PUT    /api/transfers/:id
POST   /api/transfers/:id/validate
POST   /api/transfers/:id/cancel
```

---

# 43. Adjustment APIs

```http
GET    /api/adjustments
GET    /api/adjustments/:id
POST   /api/adjustments
POST   /api/adjustments/:id/validate
```

---

# 44. Inventory APIs

```http
GET /api/inventory
GET /api/inventory/:productId
GET /api/inventory/low-stock
GET /api/inventory/out-of-stock
```

---

# 45. Ledger APIs

```http
GET /api/ledger
GET /api/ledger/:productId
```

Support filters:

```text
product
warehouse
location
operationType
dateFrom
dateTo
```

---

# 46. Dashboard API

```http
GET /api/dashboard/summary
GET /api/dashboard/operations
```

Support:

```text
documentType
status
warehouse
location
category
dateFrom
dateTo
```

---

# 47. Validation Rules

## Product

* Name required
* SKU required
* SKU unique
* Category required
* Unit of measure required
* Quantities cannot be negative

## Receipt

* At least one item
* Quantity > 0
* Warehouse required
* Location required
* Cannot validate twice

## Delivery

* At least one item
* Quantity > 0
* Sufficient stock required
* Cannot validate twice

## Transfer

* Source required
* Destination required
* Source and destination cannot be identical
* Quantity > 0
* Sufficient stock required

## Adjustment

* Product required
* Location required
* Counted quantity cannot be negative

---

# 48. Status Rules

Never allow arbitrary status transitions.

Receipt:

```text
Draft → Ready → Done
Draft → Canceled
Ready → Canceled
```

Delivery:

```text
Draft → Waiting → Ready → Done
Draft → Canceled
Waiting → Canceled
Ready → Canceled
```

Transfer:

```text
Draft → Ready → Done
Draft → Canceled
Ready → Canceled
```

Once an operation is:

```text
Done
```

it should not be edited in a way that changes historical stock movements.

Corrections should be performed through a new adjustment or corrective operation.

---

# 49. Error Handling

Use consistent responses:

```json
{
  "success": false,
  "message": "Insufficient stock",
  "code": "INSUFFICIENT_STOCK"
}
```

Common errors:

```text
PRODUCT_NOT_FOUND
INSUFFICIENT_STOCK
INVALID_STATUS
DUPLICATE_SKU
WAREHOUSE_NOT_FOUND
LOCATION_NOT_FOUND
INVALID_QUANTITY
OPERATION_ALREADY_VALIDATED
```

---

# 50. Security

All core APIs must require authentication.

Example:

```text
authenticate
     ↓
authorize
     ↓
controller
```

Never trust:

```text
userId
createdBy
role
```

sent from the frontend.

Get the authenticated user from the authentication middleware.

---

# 51. Auditability

Every inventory-changing action must record:

```text
Who
What
When
Where
How much
Reference
```

For example:

```text
User:
Adithya

Action:
DELIVERY

Product:
Steel Rod

Warehouse:
Main Warehouse

Location:
Rack A

Quantity:
20

Timestamp:
2026-09-26 11:30

Reference:
DO-0012
```

---

# 52. Frontend State Management

Keep inventory state modular.

Recommended structure:

```text
src/
├── pages/
├── components/
├── services/
│   ├── productService.js
│   ├── receiptService.js
│   ├── deliveryService.js
│   ├── transferService.js
│   ├── adjustmentService.js
│   └── dashboardService.js
├── context/
└── utils/
```

Do not put all API logic inside page components.

---

# 53. Dashboard UX

The dashboard should prioritize operational visibility.

Suggested layout:

```text
┌─────────────────────────────────────────────┐
│ StockSense Dashboard                        │
├──────────┬──────────┬──────────┬────────────┤
│ Products │ Low Stock│ Receipts │ Deliveries │
├──────────┴──────────┴──────────┴────────────┤
│                                             │
│          Inventory Operations               │
│                                             │
├─────────────────────────────────────────────┤
│ Recent Stock Movements                      │
│                                             │
└─────────────────────────────────────────────┘
```

Use clear visual status indicators for:

```text
Draft
Waiting
Ready
Done
Canceled
Low Stock
Out of Stock
```

---

# 54. Performance Requirements

Use pagination for large lists.

Do not load the entire product or ledger collection into the frontend.

Use server-side:

```text
search
filtering
sorting
pagination
```

Add database indexes for frequently searched fields:

```text
Product.sku
Product.name
Product.categoryId
Inventory.productId
Inventory.warehouseId
StockLedger.productId
StockLedger.createdAt
```

---

# 55. Testing Requirements

## Product

* [ ] Create product
* [ ] Update product
* [ ] Search by SKU
* [ ] Search by name
* [ ] Filter category
* [ ] Prevent duplicate SKU

## Receipts

* [ ] Create receipt
* [ ] Add products
* [ ] Validate receipt
* [ ] Increase stock
* [ ] Create ledger entry
* [ ] Cancel receipt
* [ ] Prevent double validation

## Deliveries

* [ ] Create delivery
* [ ] Validate sufficient stock
* [ ] Reduce stock
* [ ] Create ledger entry
* [ ] Prevent negative stock
* [ ] Cancel delivery

## Transfers

* [ ] Create transfer
* [ ] Validate source stock
* [ ] Reduce source
* [ ] Increase destination
* [ ] Create ledger entries
* [ ] Prevent same source/destination

## Adjustments

* [ ] Create adjustment
* [ ] Calculate difference
* [ ] Update stock
* [ ] Create ledger entry

## Dashboard

* [ ] KPI values are dynamic
* [ ] Low-stock count works
* [ ] Out-of-stock count works
* [ ] Pending receipt count works
* [ ] Pending delivery count works
* [ ] Transfer count works
* [ ] Filters work

---

# 56. Definition of Done

The Core Features module is complete when:

```text
✓ Products can be created and managed
✓ Categories can be managed
✓ Warehouses can be managed
✓ Locations can be managed
✓ Inventory is tracked per location
✓ Receipts increase stock
✓ Delivery orders decrease stock
✓ Internal transfers move stock between locations
✓ Stock adjustments update inventory
✓ Every stock change creates a ledger entry
✓ Stock cannot become negative through deliveries/transfers
✓ Dashboard KPIs are dynamic
✓ Low-stock alerts work
✓ Out-of-stock detection works
✓ SKU/product search works
✓ Dashboard filters work
✓ Move History works
✓ Multi-warehouse inventory works
✓ Authentication is respected
✓ User/role information is audited
✓ APIs are validated
✓ Database operations maintain consistency
✓ Pagination is implemented for large datasets
✓ No unrelated features are modified
```

---

# 57. Integration With Authentication

The authentication module is responsible for:

```text
User
Authentication
JWT
Role
Session
```

The Core Features module consumes this information.

Architecture:

```text
                 Authentication
                       │
                       ▼
                Auth Middleware
                       │
                       ▼
              Authenticated User
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
    Inventory Manager       Warehouse Staff
            │                     │
            └──────────┬──────────┘
                       ▼
                Core Features
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
   Products        Operations       Dashboard
                       │
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
       Receipts     Deliveries    Transfers
                       │
                       ▼
                 Stock Ledger
```

---

# 58. Implementation Principle

The most important system rule is:

> **The Stock Ledger is the source of truth for inventory movement history, while the Inventory collection represents the current stock state.**

Every stock-changing operation must update both consistently.

```text
Operation
   │
   ├── Update Inventory
   │
   └── Create Ledger Entry
```

Never update inventory without a corresponding ledger entry.

# End of Specification