-- MoltMail Database Schema

-- Users/Agents table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL UNIQUE,
  email_address TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP WITH TIME ZONE
);

-- Emails table
CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient_email);
CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email_address);
