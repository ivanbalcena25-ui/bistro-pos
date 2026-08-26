-- ============================================================
-- Migration: add must_change_password to users
-- Run this once against your EXISTING database (schema.sql's
-- CREATE TABLE IF NOT EXISTS won't touch a table that already exists).
--
-- Usage (from pos/backend):
--   psql -U <your_pg_user> -d <your_db_name> -f migrations/001_add_must_change_password.sql
-- ============================================================

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE;

-- Existing users already logging in fine don't need to be forced into
-- a reset the moment this migration runs — only NEW users and users
-- whose password is reset going forward will be flagged (server.js
-- sets this explicitly on create/reset). So clear it for everyone
-- who already exists today:
UPDATE users SET must_change_password = FALSE;

COMMIT;
