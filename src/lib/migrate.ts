import { query } from "./db-postgres";

export async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      actor_user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      result TEXT NOT NULL,
      metadata JSONB
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      amount NUMERIC,
      requested_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'pending'
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS invites (
      id TEXT PRIMARY KEY,
      recipient_user_id TEXT NOT NULL,
      caregiver_email TEXT NOT NULL,
      caregiver_user_id TEXT,
      permissions JSONB NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      accepted_at TIMESTAMPTZ
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS caregivers (
      id TEXT PRIMARY KEY,
      recipient_user_id TEXT NOT NULL,
      caregiver_user_id TEXT NOT NULL,
      caregiver_email TEXT NOT NULL,
      caregiver_name TEXT,
      permissions JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(recipient_user_id, caregiver_user_id)
    );
  `);

  console.log("Database migrated successfully");
}