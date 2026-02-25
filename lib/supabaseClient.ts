// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,       // or process.env.REACT_APP_SUPABASE_URL
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,  // or process.env.REACT_APP_SUPABASE_ANON_KEY
  {
    auth: { persistSession: true, autoRefreshToken: true },
  }
);
