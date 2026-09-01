import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Lead, 
  LeadFormData, 
  SupabaseConfig, 
  AppUser, 
  UserFormData, 
  DailyActivityReport, 
  DailyActivityFormData,
  ManagerApprovalStatus
} from '../types';
import { INITIAL_LEADS, INITIAL_USERS, INITIAL_DAILY_REPORTS, getDefaultPermissions } from './mockData';

// Placeholder credentials as requested
export const DEFAULT_SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || 'https://your-project-id.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || 'your-anon-key-here';
export const DEFAULT_TABLE_NAME = 'leads';
export const DEFAULT_USERS_TABLE_NAME = 'solar_users';
export const DEFAULT_DAILY_REPORTS_TABLE_NAME = 'daily_activity_reports';

const STORAGE_KEYS = {
  SUPABASE_CONFIG: 'solar_crm_supabase_config',
  LOCAL_LEADS: 'solar_crm_local_leads',
  LOCAL_USERS: 'solar_crm_local_users',
  LOCAL_DAILY_REPORTS: 'solar_crm_daily_activity_reports',
};



// SQL Schema for Supabase Table setup
export const SUPABASE_SQL_SCHEMA = `-- 1. Solar Leads Table
create table if not exists leads (
  id text primary key,
  responsible text,
  customer_name text not null,
  mobile_number text not null,
  district text,
  sub_district text,
  address text,
  pincode text,
  required_kw text,
  required_product text,
  required_loan boolean default false,
  required_free_site_visit boolean default false,
  avg_kseb_bill text,
  roof_type text,
  lead_status text default 'Open',
  next_follow_up text,
  notes text,
  special_instructions text,
  conversation_notes_history jsonb default '[]'::jsonb,
  special_instructions_history jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure newly added columns exist and types match if table was already created earlier
alter table leads add column if not exists required_kw text;
alter table leads add column if not exists required_product text;
alter table leads add column if not exists required_loan boolean default false;
alter table leads add column if not exists required_free_site_visit boolean default false;
alter table leads add column if not exists avg_kseb_bill text;
alter table leads alter column avg_kseb_bill type text;
alter table leads add column if not exists special_instructions text;
alter table leads add column if not exists conversation_notes_history jsonb default '[]'::jsonb;
alter table leads add column if not exists special_instructions_history jsonb default '[]'::jsonb;
alter table leads add column if not exists updated_at timestamptz default now();

-- Enable Row Level Security
alter table leads enable row level security;

-- Drop existing policies first to prevent "policy already exists" (Error 42710)
drop policy if exists "Allow all operations for anon on leads" on leads;
drop policy if exists "Allow all operations for authenticated on leads" on leads;

create policy "Allow all operations for anon on leads"
on leads for all
to anon, authenticated
using (true)
with check (true);

-- 2. Solar CRM Users / Team Members Table
create table if not exists solar_users (
  id text primary key,
  name text not null,
  email text,
  phone text not null,
  role text not null default 'Sales Rep',
  district text,
  status text not null default 'Active',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table solar_users enable row level security;

-- Drop existing policies first to prevent "policy already exists" (Error 42710)
drop policy if exists "Allow all operations for anon on solar_users" on solar_users;
drop policy if exists "Allow all operations for authenticated on solar_users" on solar_users;

-- 3. Daily Activity Reports Table
create table if not exists daily_activity_reports (
  id text primary key,
  planned_date_time text not null,
  activity text not null,
  customer_name text not null,
  mobile_number text not null,
  lead_assigned text not null default 'Office',
  status text not null default 'Pending',
  completed_date_time text,
  manager_approval_status text not null default 'Not Approved',
  executive_name text not null,
  executive_id text,
  lead_id text,
  remarks text,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table daily_activity_reports enable row level security;

-- Drop existing policies first
drop policy if exists "Allow all operations for anon on daily_activity_reports" on daily_activity_reports;
drop policy if exists "Allow all operations for authenticated on daily_activity_reports" on daily_activity_reports;

create policy "Allow all operations for anon on daily_activity_reports"
on daily_activity_reports for all
to anon, authenticated
using (true)
with check (true);
`;


export function getStoredSupabaseConfig(): SupabaseConfig {
  let config: SupabaseConfig = {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    tableName: DEFAULT_TABLE_NAME,
    isConnected: false,
  };
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (DEFAULT_SUPABASE_URL && !DEFAULT_SUPABASE_URL.includes('your-project-id')) {
        parsed.url = DEFAULT_SUPABASE_URL;
        parsed.anonKey = DEFAULT_SUPABASE_ANON_KEY;
        parsed.isConnected = true;
      }
      config = parsed;
    } else if (DEFAULT_SUPABASE_URL && !DEFAULT_SUPABASE_URL.includes('your-project-id')) {
      config.isConnected = true;
    }
  } catch (e) {
    console.error('Failed to parse saved supabase config', e);
  }
  return config;
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(config?: SupabaseConfig): SupabaseClient | null {
  const activeConfig = config || getStoredSupabaseConfig();
  
  // Validate if placeholders or empty
  if (
    !activeConfig.url ||
    !activeConfig.anonKey ||
    activeConfig.url.includes('your-project-id') ||
    activeConfig.anonKey.includes('your-anon-key')
  ) {
    return null;
  }

  try {
    // Check if CDN or npm instance
    if (typeof window !== 'undefined' && (window as any).supabase?.createClient) {
      supabaseInstance = (window as any).supabase.createClient(activeConfig.url, activeConfig.anonKey);
    } else {
      supabaseInstance = createClient(activeConfig.url, activeConfig.anonKey);
    }
    return supabaseInstance;
  } catch (err) {
    console.warn('Could not initialize Supabase client:', err);
    return null;
  }
}

export async function testConnection(url: string, anonKey: string, tableName = DEFAULT_TABLE_NAME): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey || url.includes('your-project-id') || anonKey.includes('your-anon-key')) {
    return {
      success: false,
      message: 'Please provide valid Supabase Project URL and Anon API Key.',
    };
  }

  try {
    const client = createClient(url, anonKey);
    const { data, error } = await client.from(tableName).select('id').limit(1);
    if (error) {
      // If table doesn't exist yet, provide helpful guidance
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: false,
          message: `Connected to Supabase project, but table "${tableName}" does not exist yet. Please run the SQL schema script below in your Supabase SQL Editor.`,
        };
      }
      return { success: false, message: `Supabase Error: ${error.message}` };
    }
    return { success: true, message: `Successfully connected to table "${tableName}"!` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed. Check network or URL format.' };
  }
}

// Local Storage Fallback Leads Helper
export function getLocalLeads(): Lead[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOCAL_LEADS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed reading local leads', e);
  }
  // Default to mock leads
  localStorage.setItem(STORAGE_KEYS.LOCAL_LEADS, JSON.stringify(INITIAL_LEADS));
  return INITIAL_LEADS;
}

export function saveLocalLeads(leads: Lead[]): void {
  localStorage.setItem(STORAGE_KEYS.LOCAL_LEADS, JSON.stringify(leads));
}

// --- High level CRM Data Provider with automatic Supabase or LocalStorage syncing ---

function sanitizeLeadForSupabase(lead: Partial<Lead>, stripAdvancedCols = false, numericBill = false): any {
  const payload: any = {
    id: lead.id,
    responsible: lead.responsible || 'Rahul Nair',
    customer_name: lead.customer_name || 'Valued Customer',
    mobile_number: lead.mobile_number || '',
    district: lead.district || 'Ernakulam',
    sub_district: lead.sub_district || '',
    address: lead.address || '',
    pincode: lead.pincode || '',
    required_kw: lead.required_kw || null,
    required_product: lead.required_product || null,
    required_loan: Boolean(lead.required_loan),
    required_free_site_visit: Boolean(lead.required_free_site_visit),
    avg_kseb_bill: numericBill 
      ? (parseFloat(String(lead.avg_kseb_bill || '').replace(/[^0-9.]/g, '')) || 0)
      : String(lead.avg_kseb_bill || ''),
    roof_type: lead.roof_type || 'Concrete Flat',
    lead_status: lead.lead_status || 'Open',
    next_follow_up: lead.next_follow_up || null,
    notes: lead.notes || '',
    created_at: lead.created_at || new Date().toISOString(),
    updated_at: lead.updated_at || new Date().toISOString(),
  };

  if (!stripAdvancedCols) {
    if (lead.special_instructions !== undefined) {
      payload.special_instructions = lead.special_instructions;
    }
    if (lead.conversation_notes_history !== undefined) {
      payload.conversation_notes_history = lead.conversation_notes_history;
    }
    if (lead.special_instructions_history !== undefined) {
      payload.special_instructions_history = lead.special_instructions_history;
    }
  }

  return payload;
}

export async function fetchAllLeads(): Promise<{ leads: Lead[]; source: 'supabase' | 'local'; error?: string }> {
  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient(config);

  if (client) {
    try {
      const { data, error } = await client
        .from(config.tableName || DEFAULT_TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const formatted: Lead[] = data.map((d: any) => ({
          ...d,
          avg_kseb_bill: d.avg_kseb_bill !== null && d.avg_kseb_bill !== undefined ? String(d.avg_kseb_bill) : '',
          conversation_notes_history: Array.isArray(d.conversation_notes_history) 
            ? d.conversation_notes_history 
            : (d.conversation_notes_history ? (typeof d.conversation_notes_history === 'string' ? JSON.parse(d.conversation_notes_history) : d.conversation_notes_history) : []),
          special_instructions_history: Array.isArray(d.special_instructions_history) 
            ? d.special_instructions_history 
            : (d.special_instructions_history ? (typeof d.special_instructions_history === 'string' ? JSON.parse(d.special_instructions_history) : d.special_instructions_history) : []),
        }));
        
        // Sync local cache with Supabase
        saveLocalLeads(formatted);
        return { leads: formatted, source: 'supabase' };
      }
      console.warn('Supabase query failed, falling back to local storage:', error?.message);
    } catch (err: any) {
      console.warn('Supabase query exception:', err);
    }
  }

  // Fallback to local storage
  const localLeads = getLocalLeads();
  return { leads: localLeads, source: 'local' };
}

export async function createLeadRecord(leadData: LeadFormData): Promise<{ lead: Lead; source: 'supabase' | 'local'; error?: string }> {
  const nowIso = new Date().toISOString();

  // Create initial history items if initial note/instructions exist
  const convHistory = leadData.conversation_notes_history || (leadData.notes ? [{
    id: 'cn-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    type: 'conversation_note' as const,
    text: leadData.notes,
    created_at: nowIso,
    author: leadData.responsible || 'System',
    lead_status: leadData.lead_status || 'Open',
  }] : []);

  const specHistory = leadData.special_instructions_history || (leadData.special_instructions ? [{
    id: 'si-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    type: 'special_instruction' as const,
    text: leadData.special_instructions,
    created_at: nowIso,
    author: leadData.responsible || 'System',
    lead_status: leadData.lead_status || 'Open',
  }] : []);

  const newLead: Lead = {
    ...leadData,
    id: 'lead-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    avg_kseb_bill: String(leadData.avg_kseb_bill || ''),
    conversation_notes_history: convHistory,
    special_instructions_history: specHistory,
    created_at: nowIso,
    updated_at: nowIso,
  };

  // 1. Immediately persist to LocalStorage so no data is ever lost
  const current = getLocalLeads();
  const updatedLocal = [newLead, ...current.filter((l) => l.id !== newLead.id)];
  saveLocalLeads(updatedLocal);

  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient(config);

  if (client) {
    try {
      const tableName = config.tableName || DEFAULT_TABLE_NAME;

      // Attempt 1: Full payload with new columns
      let payload = sanitizeLeadForSupabase(newLead, false, false);
      let { data, error } = await client
        .from(tableName)
        .insert([payload])
        .select()
        .single();

      // Attempt 2: If failed due to missing columns in user's Supabase DB, strip advanced columns
      if (error && (error.message?.includes('column') || error.code === '42703')) {
        console.warn('Supabase DB missing some columns, retrying insert with standard columns...');
        payload = sanitizeLeadForSupabase(newLead, true, false);
        const retryRes = await client.from(tableName).insert([payload]).select().single();
        data = retryRes.data;
        error = retryRes.error;
      }

      // Attempt 3: If failed due to numeric type constraint on avg_kseb_bill
      if (error && (error.message?.includes('numeric') || error.code === '22P02')) {
        console.warn('Supabase DB expecting numeric bill, retrying insert with numeric avg_kseb_bill...');
        payload = sanitizeLeadForSupabase(newLead, true, true);
        const retryRes = await client.from(tableName).insert([payload]).select().single();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (!error && data) {
        const mergedLead: Lead = {
          ...newLead,
          ...data,
          avg_kseb_bill: String(data.avg_kseb_bill || newLead.avg_kseb_bill),
        };
        // Update local cache with verified Supabase result
        const refreshedLocal = [mergedLead, ...getLocalLeads().filter((l) => l.id !== mergedLead.id)];
        saveLocalLeads(refreshedLocal);
        return { lead: mergedLead, source: 'supabase' };
      }

      console.warn('Supabase insert failed, retained in local storage:', error?.message);
      return { lead: newLead, source: 'local', error: error?.message };
    } catch (err: any) {
      console.warn('Supabase insert exception:', err);
      return { lead: newLead, source: 'local', error: err?.message };
    }
  }

  return { lead: newLead, source: 'local' };
}

export async function updateLeadRecord(id: string, updates: Partial<Lead>): Promise<{ success: boolean; lead?: Lead; error?: string }> {
  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient(config);
  const nowStr = new Date().toISOString();

  // 1. Immediately update local storage
  const current = getLocalLeads();
  let updatedLead: Lead | undefined;
  const updated = current.map((item) => {
    if (item.id === id) {
      updatedLead = { ...item, ...updates, updated_at: nowStr };
      return updatedLead;
    }
    return item;
  });
  saveLocalLeads(updated);

  if (client && updatedLead) {
    try {
      const tableName = config.tableName || DEFAULT_TABLE_NAME;

      // Attempt 1: Full payload
      let payload = sanitizeLeadForSupabase(updatedLead, false, false);
      let { data, error } = await client
        .from(tableName)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      // Attempt 2: Strip advanced columns if column missing
      if (error && (error.message?.includes('column') || error.code === '42703')) {
        console.warn('Supabase update missing column, retrying with base columns...');
        payload = sanitizeLeadForSupabase(updatedLead, true, false);
        const retryRes = await client.from(tableName).update(payload).eq('id', id).select().single();
        data = retryRes.data;
        error = retryRes.error;
      }

      // Attempt 3: Numeric avg_kseb_bill if type mismatch
      if (error && (error.message?.includes('numeric') || error.code === '22P02')) {
        console.warn('Supabase update numeric format retry...');
        payload = sanitizeLeadForSupabase(updatedLead, true, true);
        const retryRes = await client.from(tableName).update(payload).eq('id', id).select().single();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (!error && data) {
        const merged: Lead = {
          ...updatedLead,
          ...data,
          avg_kseb_bill: String(data.avg_kseb_bill || updatedLead.avg_kseb_bill),
        };
        const synced = getLocalLeads().map((l) => (l.id === id ? merged : l));
        saveLocalLeads(synced);
        return { success: true, lead: merged };
      }

      console.warn('Supabase update failed:', error?.message);
      return { success: true, lead: updatedLead, error: error?.message };
    } catch (err: any) {
      console.warn('Supabase update error:', err);
      return { success: true, lead: updatedLead, error: err?.message };
    }
  }

  return { success: true, lead: updatedLead };
}

export async function deleteLeadRecord(id: string): Promise<{ success: boolean; error?: string }> {
  // 1. Immediately delete from local storage
  const current = getLocalLeads();
  const filtered = current.filter((l) => l.id !== id);
  saveLocalLeads(filtered);

  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient(config);

  if (client) {
    try {
      const { error } = await client
        .from(config.tableName || DEFAULT_TABLE_NAME)
        .delete()
        .eq('id', id);

      if (!error) {
        return { success: true };
      }
      console.warn('Supabase delete error:', error?.message);
    } catch (err) {
      console.warn('Supabase delete exception:', err);
    }
  }

  return { success: true };
}

export async function bulkInsertLeadRecords(leadsList: LeadFormData[]): Promise<{ count: number; source: 'supabase' | 'local'; error?: string }> {
  const nowStr = new Date().toISOString();
  const formattedLeads: Lead[] = leadsList.map((lead, idx) => ({
    ...lead,
    id: 'lead-' + (Date.now() + idx) + '-' + Math.random().toString(36).substring(2, 6),
    avg_kseb_bill: String(lead.avg_kseb_bill || ''),
    conversation_notes_history: lead.conversation_notes_history || (lead.notes ? [{
      id: 'cn-' + Date.now() + '-' + idx,
      type: 'conversation_note' as const,
      text: lead.notes,
      created_at: nowStr,
      author: lead.responsible || 'System',
      lead_status: lead.lead_status || 'Open',
    }] : []),
    special_instructions_history: lead.special_instructions_history || (lead.special_instructions ? [{
      id: 'si-' + Date.now() + '-' + idx,
      type: 'special_instruction' as const,
      text: lead.special_instructions,
      created_at: nowStr,
      author: lead.responsible || 'System',
      lead_status: lead.lead_status || 'Open',
    }] : []),
    created_at: nowStr,
    updated_at: nowStr,
  }));

  // 1. Immediately save to LocalStorage
  const current = getLocalLeads();
  const updated = [...formattedLeads, ...current];
  saveLocalLeads(updated);

  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient(config);

  if (client) {
    try {
      const tableName = config.tableName || DEFAULT_TABLE_NAME;
      let payloads = formattedLeads.map((l) => sanitizeLeadForSupabase(l, false, false));
      let { data, error } = await client
        .from(tableName)
        .insert(payloads)
        .select();

      if (error && (error.message?.includes('column') || error.code === '42703')) {
        payloads = formattedLeads.map((l) => sanitizeLeadForSupabase(l, true, false));
        const retryRes = await client.from(tableName).insert(payloads).select();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (!error && data) {
        return { count: data.length, source: 'supabase' };
      }
      console.warn('Supabase bulk insert failed, saved in local storage:', error?.message);
      return { count: formattedLeads.length, source: 'local', error: error?.message };
    } catch (err: any) {
      console.warn('Supabase bulk insert error:', err);
      return { count: formattedLeads.length, source: 'local', error: err?.message };
    }
  }

  return { count: formattedLeads.length, source: 'local' };
}

// --- User Management Persistent Storage & Synchronization ---

export function getLocalUsers(): AppUser[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOCAL_USERS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((u: AppUser) => ({
          ...u,
          avatar_color: u.avatar_color || (u as any).avatar_url || "bg-slate-600",
          permissions: u.permissions || getDefaultPermissions(u.role),
        }));
      }
    }
  } catch (e) {
    console.error('Failed reading local users', e);
  }
  // Initialize with default users
  localStorage.setItem(STORAGE_KEYS.LOCAL_USERS, JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
}

export function saveLocalUsers(users: AppUser[]): void {
  localStorage.setItem(STORAGE_KEYS.LOCAL_USERS, JSON.stringify(users));
}

export async function fetchAllUsers(): Promise<{ users: AppUser[]; source: 'supabase' | 'local'; error?: string }> {
  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient(config);

  if (client) {
    try {
      const { data, error } = await client
        .from(DEFAULT_USERS_TABLE_NAME)
        .select('*')
        .order('name', { ascending: true });

      if (!error && Array.isArray(data)) {
        const mappedUsers = (data as AppUser[]).map((u) => ({
          ...u,
          avatar_color: u.avatar_color || (u as any).avatar_url || "bg-slate-600",
          permissions: u.permissions || getDefaultPermissions(u.role),
        }));
        return { users: mappedUsers, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase users query failed, using local storage:', err);
    }
  }

  const localUsers = getLocalUsers();
  return { users: localUsers, source: 'local' };
}

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-slate-800',
];

export async function createUserRecord(userData: UserFormData): Promise<{ user: AppUser; source: 'supabase' | 'local'; error?: string }> {
  const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const newUser: AppUser = {
    ...userData,
    id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    avatar_color: userData.avatar_color || randomColor,
    created_at: new Date().toISOString(),
    permissions: userData.permissions || getDefaultPermissions(userData.role),
  };

  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient(config);

  if (client) {
    try {
      const { data, error } = await client
        .from(DEFAULT_USERS_TABLE_NAME)
        .insert([newUser])
        .select()
        .single();

      if (!error && data) {
        const local = getLocalUsers();
        saveLocalUsers([data as AppUser, ...local]);
        return { user: data as AppUser, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase user insert failed, storing locally:', err);
    }
  }

  // Local storage
  const current = getLocalUsers();
  const updated = [newUser, ...current];
  saveLocalUsers(updated);
  return { user: newUser, source: 'local' };
}

export async function updateUserRecord(id: string, updates: Partial<UserFormData>): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient(config);

  if (client) {
    try {
      const { data, error } = await client
        .from(DEFAULT_USERS_TABLE_NAME)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const current = getLocalUsers();
        const updated = current.map((u) => (u.id === id ? (data as AppUser) : u));
        saveLocalUsers(updated);
        return { success: true, user: data as AppUser };
      }
    } catch (err) {
      console.warn('Supabase user update failed:', err);
    }
  }

  // Local storage update
  const current = getLocalUsers();
  let updatedUser: AppUser | undefined;
  const updated = current.map((u) => {
    if (u.id === id) {
      updatedUser = { ...u,
          avatar_color: u.avatar_color || (u as any).avatar_url || "bg-slate-600", ...updates };
      return updatedUser;
    }
    return u;
  });

  saveLocalUsers(updated);
  return { success: true, user: updatedUser };
}

export async function deleteUserRecord(id: string): Promise<{ success: boolean; error?: string }> {
  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient(config);

  if (client) {
    try {
      const { error } = await client
        .from(DEFAULT_USERS_TABLE_NAME)
        .delete()
        .eq('id', id);

      if (!error) {
        const current = getLocalUsers();
        saveLocalUsers(current.filter((u) => u.id !== id));
        return { success: true };
      }
    } catch (err) {
      console.warn('Supabase user delete error:', err);
    }
  }

  const current = getLocalUsers();
  const filtered = current.filter((u) => u.id !== id);
  saveLocalUsers(filtered);
  return { success: true };
}

// ==========================================
// DAILY ACTIVITY REPORTS CRUD FUNCTIONS
// ==========================================

export function getLocalDailyReports(): DailyActivityReport[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LOCAL_DAILY_REPORTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse local daily activity reports', e);
  }
  // Initialize with rich mock reports
  saveLocalDailyReports(INITIAL_DAILY_REPORTS);
  return INITIAL_DAILY_REPORTS;
}

export function saveLocalDailyReports(reports: DailyActivityReport[]): void {
  localStorage.setItem(STORAGE_KEYS.LOCAL_DAILY_REPORTS, JSON.stringify(reports));
}

export async function fetchDailyActivityReports(): Promise<{ reports: DailyActivityReport[]; source: 'supabase' | 'local' }> {
  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient(config);

  if (client) {
    try {
      const { data, error } = await client
        .from(DEFAULT_DAILY_REPORTS_TABLE_NAME)
        .select('*')
        .order('planned_date_time', { ascending: false });

      if (!error && Array.isArray(data)) {
        saveLocalDailyReports(data as DailyActivityReport[]);
        return { reports: data as DailyActivityReport[], source: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase fetch daily activity reports error:', err);
    }
  }

  return { reports: getLocalDailyReports(), source: 'local' };
}

export async function createDailyActivityReport(
  formData: DailyActivityFormData
): Promise<{ success: boolean; report?: DailyActivityReport; error?: string }> {
  const newId = `dar-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const now = new Date().toISOString();

  const newReport: DailyActivityReport = {
    ...formData,
    id: newId,
    created_at: now,
    updated_at: now,
  };

  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient(config);

  if (client) {
    try {
      const { data, error } = await client
        .from(DEFAULT_DAILY_REPORTS_TABLE_NAME)
        .insert([newReport])
        .select()
        .single();

      if (!error && data) {
        const current = getLocalDailyReports();
        saveLocalDailyReports([data as DailyActivityReport, ...current]);
        return { success: true, report: data as DailyActivityReport };
      }
    } catch (err) {
      console.warn('Supabase create daily report failed, falling back to local storage:', err);
    }
  }

  // Local storage fallback
  const current = getLocalDailyReports();
  saveLocalDailyReports([newReport, ...current]);
  return { success: true, report: newReport };
}

export async function updateDailyActivityReport(
  id: string,
  updates: Partial<DailyActivityFormData> & { approved_by?: string; approved_at?: string }
): Promise<{ success: boolean; report?: DailyActivityReport; error?: string }> {
  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient(config);
  const now = new Date().toISOString();

  const payload = {
    ...updates,
    updated_at: now,
  };

  if (client) {
    try {
      const { data, error } = await client
        .from(DEFAULT_DAILY_REPORTS_TABLE_NAME)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const current = getLocalDailyReports();
        const updated = current.map((r) => (r.id === id ? (data as DailyActivityReport) : r));
        saveLocalDailyReports(updated);
        return { success: true, report: data as DailyActivityReport };
      }
    } catch (err) {
      console.warn('Supabase daily report update failed, updating locally:', err);
    }
  }

  // Local storage update
  const current = getLocalDailyReports();
  let updatedReport: DailyActivityReport | undefined;
  const updated = current.map((r) => {
    if (r.id === id) {
      updatedReport = { ...r, ...payload };
      return updatedReport;
    }
    return r;
  });

  saveLocalDailyReports(updated);
  return { success: true, report: updatedReport };
}

export async function deleteDailyActivityReport(id: string): Promise<{ success: boolean; error?: string }> {
  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient(config);

  if (client) {
    try {
      const { error } = await client
        .from(DEFAULT_DAILY_REPORTS_TABLE_NAME)
        .delete()
        .eq('id', id);

      if (!error) {
        const current = getLocalDailyReports();
        saveLocalDailyReports(current.filter((r) => r.id !== id));
        return { success: true };
      }
    } catch (err) {
      console.warn('Supabase delete daily report error:', err);
    }
  }

  const current = getLocalDailyReports();
  const filtered = current.filter((r) => r.id !== id);
  saveLocalDailyReports(filtered);
  return { success: true };
}

export async function bulkUpdateActivityReportApprovals(
  ids: string[],
  approvalStatus: ManagerApprovalStatus,
  approvedBy: string
): Promise<{ success: boolean; count: number }> {
  const now = new Date().toISOString();
  const updates = {
    manager_approval_status: approvalStatus,
    approved_by: approvalStatus === 'Approved' ? approvedBy : undefined,
    approved_at: approvalStatus === 'Approved' ? now : undefined,
    updated_at: now,
  };

  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient(config);

  if (client) {
    try {
      await client
        .from(DEFAULT_DAILY_REPORTS_TABLE_NAME)
        .update(updates)
        .in('id', ids);
    } catch (err) {
      console.warn('Supabase bulk update approvals failed:', err);
    }
  }

  const current = getLocalDailyReports();
  const idSet = new Set(ids);
  const updated = current.map((r) => {
    if (idSet.has(r.id)) {
      return {
        ...r,
        ...updates,
      };
    }
    return r;
  });

  saveLocalDailyReports(updated);
  return { success: true, count: ids.length };
}


