import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vtlgaemdadjrokhdrbzz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bGdhZW1kYWRqcm9raGRyYnp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MTk0NDIsImV4cCI6MjA5MDM5NTQ0Mn0.EO9Eh6v4wxn1rKXTy3beAf1njFxDMscwxLdlOf2Q288';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
