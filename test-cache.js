require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('search_cache')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.log("Error:", error.message);
  } else {
    data.forEach(d => {
      console.log(`\n=== QUERY: ${d.query} ===`);
      console.log(`TOTAL RESULT: ${d.result?.total || 0}`);
      
      const papers = d.result?.papers || [];
      if (papers.length > 0) {
        console.log(`Top 1: ${papers[0].title} (Cited: ${papers[0].cited})`);
        console.log(`Top 2: ${papers[1]?.title || '-'} (Cited: ${papers[1]?.cited || 0})`);
      }
    });
  }
}
check();
