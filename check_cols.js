import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://proslsywqcijfswqgbnt.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb3Nsc3l3cWNpamZzd3FnYm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNDc4NTksImV4cCI6MjEwMzgyMzg1OX0.dxhQhPuLsSs5iUZ_um2FVgY1W_Y9agRV5io8lh4uKkU';
const supabase = createClient(supabaseUrl, supabaseKey);
async function check() {
  const { data, error } = await supabase.from('solar_users').select('*').limit(1);
  console.log('Admin user:', data);
}
check();
