-- ============================================================
-- Bistro POS — PostgreSQL Schema
-- Generated from queries in pos/backend/server.js
-- Run this once against a fresh, empty database.
-- ============================================================

BEGIN;

-- ── USERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                    SERIAL PRIMARY KEY,
    username              VARCHAR(100) NOT NULL UNIQUE,
    password              VARCHAR(255) NOT NULL,
    email                 VARCHAR(255) DEFAULT '',
    role                  VARCHAR(50)  NOT NULL DEFAULT 'Cashier',   -- 'Admin' | 'Cashier' | ...
    status                VARCHAR(50)  NOT NULL DEFAULT 'Active',    -- 'Active' | 'Inactive'
    must_change_password  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── MENU ITEMS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    price       NUMERIC(10,2) NOT NULL DEFAULT 0,
    category    VARCHAR(100),
    image       TEXT,
    status      VARCHAR(50) DEFAULT 'Available',           -- 'Available' | 'Unavailable'
    stock       INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TABLES (dining tables) ─────────────────────────────
CREATE TABLE IF NOT EXISTS tables_list (
    id          SERIAL PRIMARY KEY,
    number      INTEGER NOT NULL UNIQUE,
    status      VARCHAR(50) DEFAULT 'Available',           -- 'Available' | 'Occupied' | ...
    capacity    INTEGER DEFAULT 4,
    customer    VARCHAR(255) DEFAULT '',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SHIFTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
    id                 SERIAL PRIMARY KEY,
    cashier_id         INTEGER REFERENCES users(id),
    cashier_name       VARCHAR(100),
    opening_cash       NUMERIC(10,2) DEFAULT 0,
    closing_cash       NUMERIC(10,2),
    status             VARCHAR(50) DEFAULT 'Open',          -- 'Open' | 'Closed'
    total_sales        NUMERIC(10,2) DEFAULT 0,
    transaction_count  INTEGER DEFAULT 0,
    opened_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at          TIMESTAMPTZ
);

-- ── TRANSACTIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id               SERIAL PRIMARY KEY,
    customer_name    VARCHAR(255),
    table_no         INTEGER,
    total            NUMERIC(10,2) NOT NULL DEFAULT 0,
    amount_paid      NUMERIC(10,2) DEFAULT 0,
    change_amount    NUMERIC(10,2) DEFAULT 0,
    discount_type    VARCHAR(50) DEFAULT 'None',
    discount_amount  NUMERIC(10,2) DEFAULT 0,
    payment_method   VARCHAR(50) DEFAULT 'Cash',
    cashier_name     VARCHAR(100) DEFAULT 'Cashier',
    created_by       VARCHAR(100) DEFAULT 'Cashier',
    shift_id         INTEGER REFERENCES shifts(id),
    voided           INTEGER NOT NULL DEFAULT 0,            -- 0 = active, 1 = voided
    void_reason      TEXT,
    void_by          VARCHAR(100),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TRANSACTION ITEMS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_items (
    id              SERIAL PRIMARY KEY,
    transaction_id  INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    item_name       VARCHAR(255) NOT NULL,
    price           NUMERIC(10,2) NOT NULL DEFAULT 0,
    qty             INTEGER NOT NULL DEFAULT 1,
    subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ── KITCHEN ORDERS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS kitchen_orders (
    id            SERIAL PRIMARY KEY,
    table_no      INTEGER,
    cashier_name  VARCHAR(100),
    status        VARCHAR(50) DEFAULT 'Pending',            -- 'Pending' | 'Preparing' | 'Served' ...
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ
);

-- ── KITCHEN ORDER ITEMS ────────────────────────────────
CREATE TABLE IF NOT EXISTS kitchen_order_items (
    id        SERIAL PRIMARY KEY,
    order_id  INTEGER NOT NULL REFERENCES kitchen_orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    qty       INTEGER NOT NULL DEFAULT 1,
    notes     TEXT DEFAULT ''
);

-- ── Helpful indexes ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transaction_items_tx   ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_order_items_ord ON kitchen_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_shift      ON transactions(shift_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_items_category     ON menu_items(category);

COMMIT;
