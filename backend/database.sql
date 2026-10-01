-- ==============================================================================
-- ServeFlow Enterprise Multi-Tenant Restaurant SaaS & Multi-Branch ERP
-- Relational MySQL Schema
-- ==============================================================================
--
-- HIERARCHY ARCHITECTURE:
--
--                     YOUR PLATFORM
--                          │
--                     SUPER ADMIN
--                          │
--              ┌───────────┴───────────┐
--              │                       │
--        RESTAURANT A             RESTAURANT B
--              │                       │
--        ┌─────┴─────┐           ┌─────┴─────┐
--     Branch 1     Branch 2     Branch 1    Branch 2
--        │             │
--     Staff          Staff
--        │
--  Roles + Permissions
--        │
--  ┌─────┼────────┬─────────┐
-- Cashier Waiter Kitchen  Manager
--        │
--        ▼
--     CUSTOMER
--        │
--     QR / Website
--        │
--      ORDER
--        │
--  Kitchen → Billing → Payment
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS serveflow_db;
USE serveflow_db;

-- ==============================================================================
-- 1. PLATFORM & SUPER ADMIN (THE APEX)
-- ==============================================================================

-- 1.1 Super Admin Platform Owners
CREATE TABLE IF NOT EXISTS super_admins (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'SUPER_ADMIN',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Global SaaS Platform Settings
CREATE TABLE IF NOT EXISTS platform_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    platform_name VARCHAR(150) DEFAULT 'ServeFlow SaaS Platform',
    support_email VARCHAR(150) DEFAULT 'support@serveflow.io',
    support_phone VARCHAR(50) DEFAULT '+91 98765 43210',
    currency VARCHAR(10) DEFAULT 'INR',
    currency_symbol VARCHAR(5) DEFAULT '₹',
    gst_rate DECIMAL(5,2) DEFAULT 5.00,
    trial_days INT DEFAULT 14,
    gateway_mode ENUM('simulator', 'razorpay', 'stripe') DEFAULT 'simulator',
    razorpay_key_id VARCHAR(150) DEFAULT '',
    stripe_publishable_key VARCHAR(150) DEFAULT '',
    maintenance_mode BOOLEAN DEFAULT FALSE,
    enable_public_signup BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 1.3 SaaS Subscription Packages (Super Admin Configured)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    billing_cycle ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    max_branches INT NOT NULL DEFAULT 1,
    max_staff INT NOT NULL DEFAULT 5,
    max_orders_per_month INT DEFAULT 1000,
    features JSON NOT NULL,
    badge VARCHAR(50) DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. RESTAURANT BUSINESSES / TENANTS (THE CUSTOMERS OF SAAS)
-- ==============================================================================

-- 2.1 Restaurant Companies (Strict Tenant Isolation)
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(36) PRIMARY KEY,
    business_id VARCHAR(50) UNIQUE NOT NULL, -- e.g. REST-10001
    owner_id VARCHAR(50) NOT NULL,          -- e.g. OWN-10001
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    business_type VARCHAR(50) DEFAULT 'Fine Dine',
    tax_identifier VARCHAR(50) DEFAULT '',  -- GST Number
    currency VARCHAR(10) DEFAULT '₹',
    status ENUM('ACTIVE', 'TRIAL', 'EXPIRED', 'SUSPENDED') DEFAULT 'ACTIVE',
    plan_id VARCHAR(50) NOT NULL,
    subscription_expiry DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- 2.2 SaaS Subscriptions Ledger
CREATE TABLE IF NOT EXISTS saas_subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    business_id VARCHAR(50) NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    status ENUM('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
    billing_cycle ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    price_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- 2.3 SaaS Revenue & Transaction Payments (Restaurant Owner -> Super Admin)
CREATE TABLE IF NOT EXISTS saas_payments (
    id VARCHAR(50) PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT '₹',
    payment_method VARCHAR(50) DEFAULT 'UPI',
    payment_status ENUM('success', 'pending', 'failed', 'refunded') DEFAULT 'success',
    receipt_url VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 3. MULTIPLE BRANCHES / OUTLETS (SPATIAL DISTRIBUTION)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,           -- e.g. 'Bopal Outlet', 'Satellite Branch'
    code VARCHAR(50) NOT NULL,           -- e.g. 'BR-BOPAL', 'BR-01'
    city VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(30),
    manager_name VARCHAR(100) DEFAULT '',
    opening_time VARCHAR(20) DEFAULT '11:00 AM',
    closing_time VARCHAR(20) DEFAULT '11:30 PM',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX (company_id, code)
);

-- ==============================================================================
-- 4. STAFF, ROLES & PERMISSIONS (DECOUPLED RBAC)
-- ==============================================================================

-- 4.1 Granular Roles Matrix (WHAT an employee can do)
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,          -- e.g. 'Cashier', 'Waiter', 'Kitchen Staff', 'Branch Manager'
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    permissions JSON NOT NULL,           -- Matrix of View, Create, Edit, Delete, Export, Approve per module
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 4.2 Users / Employees
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30) DEFAULT '',
    password_hash VARCHAR(255) NOT NULL,
    has_all_branch_access BOOLEAN DEFAULT FALSE, -- TRUE for Restaurant Owner / Area Manager
    status ENUM('ACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    avatar VARCHAR(255) DEFAULT '',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 4.3 Spatial Branch Assignments (WHERE an employee can execute permissions)
CREATE TABLE IF NOT EXISTS user_branch_assignments (
    user_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, branch_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 5. RESTAURANT STORE CONFIGURATION, MENU & TABLES
-- ==============================================================================

-- 5.1 Store POS Configuration
CREATE TABLE IF NOT EXISTS restaurants (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) DEFAULT NULL,
    name VARCHAR(150) NOT NULL,
    tagline VARCHAR(255) DEFAULT '',
    slug VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(30),
    email VARCHAR(100),
    gst_number VARCHAR(30),
    currency VARCHAR(10) DEFAULT '₹',
    tax_rate DECIMAL(5,2) DEFAULT 5.00,
    service_charge DECIMAL(5,2) DEFAULT 0.00,
    invoice_prefix VARCHAR(20) DEFAULT 'INV-',
    footer_text TEXT,
    kot_printer VARCHAR(100) DEFAULT 'Kitchen Thermal POS-80',
    bill_printer VARCHAR(100) DEFAULT 'Counter Thermal POS-80',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 5.2 Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) DEFAULT NULL,
    restaurant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 5.3 Food Items Catalog
CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) DEFAULT NULL,
    restaurant_id VARCHAR(50) NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    is_veg BOOLEAN DEFAULT TRUE,
    gst_rate DECIMAL(5,2) DEFAULT 5.00,
    is_available BOOLEAN DEFAULT TRUE,
    image VARCHAR(255) DEFAULT '',
    preparation_time INT DEFAULT 15,
    variants JSON,
    add_ons JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
);

-- 5.4 Dining Tables & QR Codes
CREATE TABLE IF NOT EXISTS dining_tables (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NOT NULL,
    restaurant_id VARCHAR(50) NOT NULL,
    table_number VARCHAR(20) NOT NULL,   -- e.g. 'T-01', 'T-04'
    floor VARCHAR(50) DEFAULT 'Floor 1',
    capacity INT DEFAULT 4,
    status ENUM('available', 'occupied', 'reserved', 'billing') DEFAULT 'available',
    current_order_id VARCHAR(50) DEFAULT NULL,
    merged_with VARCHAR(50) DEFAULT NULL,
    qr_code_url VARCHAR(255) DEFAULT '', -- Direct URL: /menu/{company_id}/{branch_id}/{table_number}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    INDEX (company_id, branch_id, table_number)
);

-- ==============================================================================
-- 6. CUSTOMER & ORDER LIFECYCLE PIPELINE
-- ==============================================================================
-- Flow: CUSTOMER (QR/Web) ➔ ORDER ➔ KITCHEN (KOT) ➔ BILLING ➔ PAYMENT
-- ==============================================================================

-- 6.1 Restaurant Customers
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) DEFAULT NULL,
    restaurant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(100) DEFAULT '',
    address TEXT,
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    last_visit TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 6.2 Orders (The Central Pivot of Customer Experience)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NOT NULL,
    restaurant_id VARCHAR(50) NOT NULL,
    order_number VARCHAR(50) NOT NULL,  -- e.g. ORD-20260927-0001
    table_id VARCHAR(50) DEFAULT NULL,
    table_name VARCHAR(50) DEFAULT NULL,
    customer_id VARCHAR(50) DEFAULT NULL,
    customer_name VARCHAR(100) DEFAULT 'Walk-in Guest',
    customer_phone VARCHAR(30) DEFAULT '',
    order_type ENUM('dine-in', 'takeaway', 'delivery') DEFAULT 'dine-in',
    items JSON NOT NULL,                -- Array of items, variant, price, quantity
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10,2) DEFAULT 0.00,
    tax DECIMAL(10,2) DEFAULT 0.00,
    service_charge DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('pending', 'kot_sent', 'preparing', 'ready', 'served', 'billing', 'completed', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('unpaid', 'paid', 'partially_paid', 'refunded') DEFAULT 'unpaid',
    payment_method ENUM('cash', 'upi', 'card', 'split', 'unpaid') DEFAULT 'unpaid',
    created_by_user_id VARCHAR(36) DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    INDEX (company_id, branch_id, status)
);

-- 6.3 Kitchen Order Tickets (KOT) -> Displayed to Kitchen Staff
CREATE TABLE IF NOT EXISTS kots (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NOT NULL,
    restaurant_id VARCHAR(50) NOT NULL,
    kot_number VARCHAR(50) NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    order_number VARCHAR(50) NOT NULL,
    table_number VARCHAR(50) DEFAULT '',
    order_type ENUM('dine-in', 'takeaway', 'delivery') DEFAULT 'dine-in',
    items JSON NOT NULL,
    special_note TEXT,
    status ENUM('new', 'preparing', 'ready', 'completed') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prepared_at TIMESTAMP NULL,
    ready_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 6.4 Bills / Invoices -> Generated by Cashier
CREATE TABLE IF NOT EXISTS bills (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100) DEFAULT 'Guest',
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_reason VARCHAR(100) DEFAULT '',
    tax_amount DECIMAL(10,2) NOT NULL,
    service_charge DECIMAL(10,2) DEFAULT 0.00,
    round_off DECIMAL(5,2) DEFAULT 0.00,
    grand_total DECIMAL(10,2) NOT NULL,
    cashier_user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 6.5 Customer Food Order Payments -> Processed by Cashier
CREATE TABLE IF NOT EXISTS order_payments (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    bill_id VARCHAR(50) DEFAULT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'upi', 'card', 'split', 'other') NOT NULL,
    payment_reference VARCHAR(100) DEFAULT '', -- UPI Reference / Card Auth Code
    status ENUM('success', 'failed', 'refunded') DEFAULT 'success',
    collected_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 7. INVENTORY, PURCHASES, SUPPLIERS, EXPENSES & AUDIT TRAIL
-- ==============================================================================

-- 7.1 Inventory Stock
CREATE TABLE IF NOT EXISTS inventory_items (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NOT NULL,
    restaurant_id VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    min_stock DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('healthy', 'low', 'critical') DEFAULT 'healthy',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- 7.2 Stock Movements & Wastage
CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NOT NULL,
    restaurant_id VARCHAR(50) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    type ENUM('in', 'out', 'adjustment', 'wastage') NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    reason TEXT,
    recorded_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- 7.3 Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    restaurant_id VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    gst_number VARCHAR(30),
    products_supplied TEXT,
    outstanding_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 7.4 Purchases
CREATE TABLE IF NOT EXISTS purchases (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NOT NULL,
    restaurant_id VARCHAR(50) NOT NULL,
    supplier_id VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(150) NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    items JSON NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('draft', 'received', 'cancelled') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- 7.5 Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NOT NULL,
    restaurant_id VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    category ENUM('Electricity', 'Rent', 'Salary', 'Maintenance', 'Raw Material', 'Transport', 'Other') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
    notes TEXT,
    recorded_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- 7.6 Real-Time Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) DEFAULT NULL,
    restaurant_id VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'urgent') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 7.7 Immutable Footprint & Security Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    user_id VARCHAR(36) NOT NULL,
    user_name VARCHAR(100) DEFAULT '',
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details JSON,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX (company_id, created_at)
);

-- ==============================================================================
-- 8. SALES LEADS, DEMO REQUESTS & SUPPORT TICKETS (SAAS LIFECYCLE)
-- ==============================================================================

-- 8.1 Demo Requests & Sales Leads (Petpooja Assisted Sales Funnel)
CREATE TABLE IF NOT EXISTS sales_leads (
    id VARCHAR(50) PRIMARY KEY,
    restaurant_name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    number_of_branches INT DEFAULT 1,
    restaurant_type VARCHAR(50) DEFAULT 'Fine Dine',
    daily_orders VARCHAR(50) DEFAULT '50-150',
    current_software VARCHAR(100) DEFAULT 'None / Excel',
    requirements TEXT,
    message TEXT,
    status ENUM('new', 'contacted', 'demo_scheduled', 'demo_completed', 'proposal_sent', 'negotiation', 'converted', 'lost', 'follow_up_required') DEFAULT 'new',
    assigned_to VARCHAR(100) DEFAULT 'Sales Team',
    notes TEXT,
    follow_up_date DATE NULL,
    converted_company_id VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (status),
    INDEX (created_at)
);

-- 8.2 Customer Support & Helpdesk Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    category ENUM('Billing', 'POS Issue', 'Hardware / Printer', 'Feature Request', 'Onboarding', 'Other') DEFAULT 'POS Issue',
    priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
    description TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed') DEFAULT 'open',
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX (company_id),
    INDEX (status)
);

-- 8.3 Guided 12-Step Onboarding Progress Tracker
CREATE TABLE IF NOT EXISTS onboarding_progress (
    company_id VARCHAR(36) PRIMARY KEY,
    current_step INT DEFAULT 1,
    completed_steps JSON NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 9.0 Recipes and Bill of Materials (BOM) Supply Chain
CREATE TABLE IF NOT EXISTS recipes (
    id VARCHAR(50) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36),
    branch_id VARCHAR(36),
    menu_item_id VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    preparation_instructions TEXT,
    serving_size DECIMAL(6,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX (restaurant_id),
    INDEX (menu_item_id),
    INDEX (branch_id)
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id VARCHAR(50) PRIMARY KEY,
    recipe_id VARCHAR(50) NOT NULL,
    ingredient_id VARCHAR(50) NOT NULL,
    sub_recipe_id VARCHAR(50),
    quantity DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    wastage_percent DECIMAL(5,2) DEFAULT 0.00,
    cost_per_unit DECIMAL(10,2) DEFAULT 0.00,
    calculated_cost DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    INDEX (recipe_id),
    INDEX (ingredient_id)
);
