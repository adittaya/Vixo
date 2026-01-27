
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yrzbbfmvgzczrhialwwr.supabase.co';
const supabaseKey = 'sb_publishable_KUjKTVchXY4qQsBCBS44dA_zfOgdwAZ';

// The Legacy JWT secret is kept for reference but not needed for basic client auth
// Secret: 3nYXVkUyN+1ZyPNRriYRug3Q9E9LHtZ7mFoyXosIXeqE83WAvuzuuPlirIoKFUyuJUD/VX/3J2B0L6iIKisaow==

// Create Supabase client with error handling
let supabaseInstance: any;

// Initialize Supabase client with error handling
try {
  supabaseInstance = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.error("Failed to initialize Supabase client:", error);
  // Create a mock client for development
  supabaseInstance = {
    from: (table: string) => ({
      select: (columns?: string) => ({
        maybeSingle: async () => ({ data: null, error: null }),
        eq: (column: string, value: any) => ({
          maybeSingle: async () => ({ data: null, error: null })
        })
      }),
      upsert: async (data: any) => ({ error: null }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({ error: null })
      })
    })
  };
  console.warn("Using mock Supabase client for development");
}

export const supabase = supabaseInstance;
