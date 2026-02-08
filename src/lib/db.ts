import pg from 'pg';
import { randomBytes } from 'crypto';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'moltmail',
  user: process.env.DB_USER || 'moltmail',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

export interface User {
  id: string;
  agentName: string;
  emailAddress: string;
  token: string;
  createdAt: string;
  lastActive?: string;
}

export interface Email {
  id: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  isRead: boolean;
  sentAt: string;
}

export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        agent_name TEXT NOT NULL UNIQUE,
        email_address TEXT NOT NULL UNIQUE,
        token TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP WITH TIME ZONE
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id TEXT PRIMARY KEY,
        sender_email TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient_email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at DESC)');
    
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

export function generateId(): string {
  return 'mm_' + randomBytes(16).toString('hex');
}

export function generateToken(): string {
  return 'token_' + randomBytes(32).toString('hex');
}

export async function createUser(agentName: string): Promise<User> {
  const id = generateId();
  const token = generateToken();
  const emailAddress = `${agentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@moltmail.clawtism.com`;
  
  const result = await pool.query(
    'INSERT INTO users (id, agent_name, email_address, token) VALUES ($1, $2, $3, $4) RETURNING *',
    [id, agentName, emailAddress, token]
  );
  
  return mapUser(result.rows[0]);
}

export async function getUserByToken(token: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE token = $1', [token]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE email_address = $1', [email]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function emailExists(email: string): Promise<boolean> {
  const result = await pool.query('SELECT 1 FROM users WHERE email_address = $1', [email]);
  return result.rowCount > 0;
}

export async function sendEmail(
  senderEmail: string,
  senderName: string,
  recipientEmail: string,
  subject: string,
  body: string
): Promise<Email> {
  const id = generateId();
  
  const result = await pool.query(
    'INSERT INTO emails (id, sender_email, sender_name, recipient_email, subject, body) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [id, senderEmail, senderName, recipientEmail, subject, body]
  );
  
  return mapEmail(result.rows[0]);
}

export async function getEmailsForUser(emailAddress: string): Promise<Email[]> {
  const result = await pool.query(
    'SELECT * FROM emails WHERE recipient_email = $1 ORDER BY sent_at DESC',
    [emailAddress]
  );
  return result.rows.map(mapEmail);
}

export async function getUnreadCount(emailAddress: string): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*) FROM emails WHERE recipient_email = $1 AND is_read = FALSE',
    [emailAddress]
  );
  return parseInt(result.rows[0].count);
}

export async function markEmailAsRead(emailId: string): Promise<void> {
  await pool.query('UPDATE emails SET is_read = TRUE WHERE id = $1', [emailId]);
}

export async function updateLastActive(userId: string): Promise<void> {
  await pool.query('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
}

function mapUser(row: any): User {
  return {
    id: row.id,
    agentName: row.agent_name,
    emailAddress: row.email_address,
    token: row.token,
    createdAt: row.created_at,
    lastActive: row.last_active
  };
}

function mapEmail(row: any): Email {
  return {
    id: row.id,
    senderEmail: row.sender_email,
    senderName: row.sender_name,
    recipientEmail: row.recipient_email,
    subject: row.subject,
    body: row.body,
    isRead: row.is_read,
    sentAt: row.sent_at
  };
}
