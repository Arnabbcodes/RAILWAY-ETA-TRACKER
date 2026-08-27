

const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_PUBLIC_KEY";

// Initialize the Supabase client (supabase-js loaded via CDN in index.html)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// The backend API base URL.
// - Locally (vercel dev): leave as "/api"
// - After deploying to Vercel: also "/api" (relative, same domain) — no change needed.
const API_BASE_URL = "/api";
