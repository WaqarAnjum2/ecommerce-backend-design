-- SQL: create table for storing inquiries
-- PostgreSQL syntax

CREATE TABLE IF NOT EXISTS inquiries (
  id VARCHAR(64) PRIMARY KEY,
  -- user who created the inquiry (nullable for anonymous submissions)
  user_id VARCHAR(64),
  user_email TEXT,
  subject TEXT NOT NULL,
  details TEXT NOT NULL,
  quantity VARCHAR(64),
  unit VARCHAR(32),
  status VARCHAR(32) NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Example insert
-- INSERT INTO inquiries (id, subject, details, quantity, unit) VALUES ('1623456789-abcd', 'Need 100 widgets', 'Please send quotes for 100 widgets with specs...', '100', 'Pcs');
-- Example insert including user and status
-- INSERT INTO inquiries (id, user_id, user_email, subject, details, quantity, unit, status) 
-- VALUES ('1623456789-abcd', 'user-uuid-1234', 'buyer@example.com', 'Need 100 widgets', 'Please send quotes for 100 widgets with specs...', '100', 'Pcs', 'new');
