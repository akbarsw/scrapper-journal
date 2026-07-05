const { createClient } = require('@supabase/supabase-js');

// Kita hardcode API key-nya buat ngetes doang di terminal VPS
const supabase = createClient(
  "https://tdqqllmrrtcahzvuhtvf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Wait, I need the actual anon key from .env.local
);
