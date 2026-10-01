# ServeFlow — Modern Restaurant Management & POS Web Application

**ServeFlow** is a complete, production-grade restaurant operating system built with **React**, **Node.js**, **Express**, and **MySQL**. It provides an ultra-fast Point-of-Sale (POS) terminal, live Kitchen Order Ticket (KOT) display, visual floor and table management, recipe inventory with automated wastage deductions, supplier purchases, staff role permissions, business intelligence reports, and a public mobile-first customer QR menu.

---

## 🚀 Live Application Access

The application is running and accessible at:

* **Main Application (Dashboard & Staff Terminals):** [http://localhost:5000](http://localhost:5000)
* **Public Customer QR Menu:** [http://localhost:5000/menu/restaurant-demo](http://localhost:5000/menu/restaurant-demo)
* **API Health Status:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Quick Demo Login Credentials

On the login page, you can either click the **1-Click Demo Buttons** or use the credentials below:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner@serveflow.com` | `password123` | Full SuperAdmin access to all modules |
| **Manager** | `manager@serveflow.com` | `password123` | Floor, Inventory, Purchasing, Reports, Staff |
| **Cashier** | `cashier@serveflow.com` | `password123` | POS Terminal, Orders, Billing & Customers |
| **Kitchen Staff** | `kitchen@serveflow.com` | `password123` | Live Kitchen KOT Order Screen & Inventory View |

---

## 🛠️ Technology Stack & Architecture

* **Frontend:**
  * **React 19** with clean functional components & hooks
  * **Tailwind CSS** for modern SaaS aesthetics (soft borders, rounded cards, clean spacing)
  * **React Router v7** for single-page routing & role-based route guards
  * **Lucide React** for crisp, consistent iconography
  * **Recharts** for sales velocity, payment mix, and category revenue charts
  * **Axios** with automatic JWT bearer token interceptors
* **Backend:**
  * **Node.js** & **Express.js** REST API
  * **JWT (JSON Web Tokens)** for stateless authentication
  * **bcryptjs** for secure password hashing
  * Role-based authorization middleware (`owner`, `manager`, `cashier`, `kitchen`, `waiter`)
* **Database & Storage:**
  * **MySQL** with complete relational DDL schema (`database.sql`)
  * `mysql2/promise` connection pool
  * Automatic schema migration and demo restaurant seed engine (`Urban Spice Restaurant`)
  * Built-in fallback resilience ensuring zero crashes out of the box even before local MySQL service is launched

---

## 📁 Project Structure

```
serveflow/
├── backend/
│   ├── database.sql               # Production MySQL DDL schema
│   ├── .env                       # Environment & MySQL configuration
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── db.js              # MySQL connection pool & migration runner
│       │   └── seedData.js        # "Urban Spice Restaurant" comprehensive seed data
│       ├── controllers/           # Modular REST controllers for all 14 modules
│       ├── middleware/            # JWT authentication & role-based authorization
│       ├── routes/                # Express API route index
│       ├── services/              # Centralized MySQL DataService layer
│       └── server.js              # Server entry point & frontend static server
├── frontend/
│   ├── build.js                   # Custom fast WASM production bundler
│   ├── index.html                 # Clean HTML shell with Plus Jakarta Sans & favicon
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── components/
│       │   └── common/            # Modal, Drawer, StatusBadge, EmptyState, Skeleton, PrintableBill
│       ├── context/               # AuthContext & ToastContext
│       ├── layouts/               # AppLayout (Desktop fixed sidebar, Mobile drawer & bottom nav)
│       ├── pages/                 # All 15 module pages (POS, KOT, Dashboard, Tables, etc.)
│       └── services/api.js        # Axios instance with interceptors
└── test_e2e.js                    # End-to-End API verification test suite
```

---

## 📊 Modules & Key Capabilities

1. **Dashboard:**
   * Today's Sales (`₹24,580`, `+12.4% vs yesterday`)
   * Today's Orders (`148`, `+8.2%`)
   * Average Order Value (`₹412`)
   * Pending Orders (`12 active in kitchen`)
   * Recharts interactive Sales Overview area chart with filters (`Today`, `7 Days`, `30 Days`, `This Month`)
   * Order summary doughnut chart (`Dine-in`, `Takeaway`, `Delivery`)
   * Top selling items leaderboard & real-time low-stock inventory alerts.
2. **POS Module:**
   * Category list navigation with dish counts
   * Item cards with Veg/Non-veg tags, thumbnails, and quick `+ Add`
   * Variant selector (e.g. Regular vs Large) & add-on toppings (e.g. Extra Cheese)
   * Live order cart with quantity adjustments, custom item notes (`"less spicy"`)
   * Table selection and customer selection
   * Subtotal, percentage discount, 5% GST tax calculation, and grand total
   * **Hold Order** & restore held orders
   * **Send KOT** to kitchen
   * **Charge** order with demo payment drawer (Cash with change calculator, UPI QR, Card, Split)
3. **Kitchen Order Tickets (KOT):**
   * 4-column kitchen kanban board: `NEW` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`
   * Elapsed time counter badges (`14 min`)
   * Sound alert toggle for new incoming orders
4. **Floor & Table Management:**
   * Visual table plan across `Floor 1`, `Floor 2`, and `Terrace`
   * Status indicators: `Available`, `Occupied`, `Billing`, `Reserved`
   * Table merging & order transfers between dining tables
   * Quick bill preview and invoice generation
5. **Menu & Catalog:**
   * Dish listing with search, category filtering, and instant In-Stock / Out-of-Stock toggle
   * Add and edit modal with pricing, description, dietary tag, and GST rate
6. **Raw Stock Inventory:**
   * Real-time stock levels with unit metrics (`kg`, `ltr`, `pcs`)
   * Minimum stock buffer thresholds and low stock warning banners
   * Stock adjustment modal (audit +/-) and kitchen wastage deduction recording
7. **Purchases & Suppliers:**
   * Supplier directory with contact details, GSTIN, and outstanding balances
   * Purchase orders consignment creation
   * Automatically increments ingredient inventory when purchase is marked `Received`
8. **Guest Relationship CRM:**
   * Customer profiles with lifetime spend, visit counts, favorite dishes, and dietary notes
   * Full past order visit history
9. **Staff & Permissions:**
   * Employee roster with roles (`Owner`, `Manager`, `Cashier`, `Kitchen Staff`, `Waiter`)
   * Role-based permissions matrix
10. **Expense Ledger:**
    * Operating cost tracking by category (`Rent`, `Electricity`, `Salary`, `Maintenance`, `Raw Material`)
    * Monthly expense KPIs and category distribution chart
11. **Business Intelligence Reports:**
    * Sales reports, dish quantity reports, category revenue pie charts, payment gateway tender splits
    * In-browser **CSV export** and **print report**
12. **Tax Invoice & Thermal Print:**
    * Professional printable receipt modal with GSTIN, itemized breakdown, tax details, and footer note
13. **Customer QR Menu (`/menu/restaurant-demo`):**
    * Mobile-first digital menu for guests at tables
    * Live category scrolling, search, item customization, and self-order submission
