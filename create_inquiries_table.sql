-- SQL: create table for storing inquiries
-- PostgreSQL syntax

CREATE TABLE IF NOT EXISTS inquiries (
  id VARCHAR(64) PRIMARY KEY,
  subject TEXT NOT NULL,
  details TEXT NOT NULL,
  quantity VARCHAR(64),
  unit VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Example insert
-- INSERT INTO inquiries (id, subject, details, quantity, unit) VALUES ('1623456789-abcd', 'Need 100 widgets', 'Please send quotes for 100 widgets with specs...', '100', 'Pcs');
