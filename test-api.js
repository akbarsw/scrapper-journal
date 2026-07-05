require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('search_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.log("Error:", error.message);
  } else {
    data.forEach(d => console.log(`[${d.created_at}] Query: "${d.query}"`));
  }
}
check();
