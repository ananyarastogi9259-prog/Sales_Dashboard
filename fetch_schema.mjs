import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSchema() {
  const tables = ['destinations', 'orders', 'products', 'users'];
  
  for (const table of tables) {
    console.log(`\n--- Checking table: ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      console.error(`Error fetching from ${table}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Columns in ${table}:`, Object.keys(data[0]).join(', '));
      console.log(`Sample data:`, data[0]);
    } else {
      console.log(`Table ${table} is empty, but query succeeded.`);
    }
  }
}

checkSchema();
