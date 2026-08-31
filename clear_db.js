import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vwomxyeuzxiexdicypra.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3b214eWV1enhpZXhkaWN5cHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNzYyNzQsImV4cCI6MjEwMzY1MjI3NH0.D_szVCsOrb4yo7Hzx_kkg00XThQrpGzGAc4CEGiGjU0';
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
