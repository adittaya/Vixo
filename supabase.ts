
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yrzbbfmvgzczrhialwwr.supabase.co';
const supabaseKey = 'sb_publishable_KUjKTVchXY4qQsBCBS44dA_zfOgdwAZ';

// The Legacy JWT secret is kept for reference but not needed for basic client auth
// Secret: 3nYXVkUyN+1ZyPNRriYRug3Q9E9LHtZ7mFoyXosIXeqE83WAvuzuuPlirIoKFUyuJUD/VX/3J2B0L6iIKisaow==

export const supabase = createClient(supabaseUrl, supabaseKey);
