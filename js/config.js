/* ============================================
   VaultDrop — Supabase Configuration
   ============================================
   SETUP INSTRUCTIONS:
   1. Go to https://supabase.com and create a free project.
   2. In your Supabase dashboard → Project Settings → API:
      - Copy your "Project URL" → paste below as SUPABASE_URL
      - Copy your "anon/public" key → paste below as SUPABASE_ANON_KEY
   3. Create a Storage bucket named "files" (set to public).
   4. Run the SQL in supabase/setup.sql to create the database table.
   5. Open index.html in your browser — you're ready!
   ============================================ */

const SUPABASE_URL  = 'https://ydkacadgulagcnutjbhm.supabase.co';       // e.g. https://xyzabc.supabase.co
const SUPABASE_ANON_KEY = 'sb_publishable_DRhLh8SzC2ZG9jeUe-E-5g_bCNjyZcO'; // starts with eyJ...

// Use a distinct name to avoid colliding with the SDK global `supabase` object.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage bucket name (must match what you created in Supabase)
const BUCKET_NAME = 'files';

// Base URL for share links — update this if you deploy to a custom domain
const BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');