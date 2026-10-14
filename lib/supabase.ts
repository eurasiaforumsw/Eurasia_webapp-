// Database operations using Neon PostgreSQL
import { db } from './db';

export { db };
export const supabase = db;
export const supabaseAdmin = db;
export const isConfigured = !!process.env.DATABASE_URL;
