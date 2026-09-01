import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://proslsywqcijfswqgbnt.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb3Nsc3l3cWNpamZzd3FnYm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNDc4NTksImV4cCI6MjEwMzgyMzg1OX0.dxhQhPuLsSs5iUZ_um2FVgY1W_Y9agRV5io8lh4uKkU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearData() {
  console.log('Clearing leads...');
  await supabase.from('leads').delete().neq('id', 'dummy');
  
  console.log('Clearing daily_activity_reports...');
  await supabase.from('daily_activity_reports').delete().neq('id', 'dummy');
  
  console.log('Clearing solar_users except Admin...');
  await supabase.from('solar_users').delete().neq('role', 'Admin');
  
  console.log('Done!');
}
clearData();
