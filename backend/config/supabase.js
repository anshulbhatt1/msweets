const { createClient } = require('@supabase/supabase-js');

// Admin client with service role key - bypasses RLS
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Public client with anon key - respects RLS
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = { supabase, supabaseAdmin };
