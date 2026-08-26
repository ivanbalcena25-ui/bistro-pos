-- ============================================================
-- Optional seed data — creates one default Admin account and
-- a couple of dining tables so the app isn't totally empty.
--
-- Login: username = admin, password = admin123
-- The password is stored in plain text here; server.js will
-- auto-hash it with bcrypt the first time you log in with it.
-- CHANGE THIS PASSWORD after your first login.
-- ============================================================

INSERT INTO users (username, password, email, role, status)
VALUES ('admin', 'admin123', 'admin@example.com', 'Admin', 'Active')
ON CONFLICT (username) DO NOTHING;

INSERT INTO tables_list (number, status, capacity)
VALUES (1, 'Available', 4), (2, 'Available', 4), (3, 'Available', 4), (4, 'Available', 4)
ON CONFLICT (number) DO NOTHING;
