import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vwomxyeuzxiexdicypra.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3b214eWV1enhpZXhkaWN5cHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNzYyNzQsImV4cCI6MjEwMzY1MjI3NH0.D_szVCsOrb4yo7Hzx_kkg00XThQrpGzGAc4CEGiGjU0';
const supabase = createClient(supabaseUrl, supabaseKey);
async function seed() {
  const admin = {
    id: 'usr-7',
    name: 'Vishnu Kondaas',
    email: 'vishnu.kondaas@gmail.com',
    phone: '+919847000001',
    role: 'Admin',
    district: 'All Kerala',
    status: 'Active',
    avatar_url: 'bg-slate-900',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('solar_users').insert([admin]);
  console.log('Seeded admin:', error || 'Success');
}
seed();
