import { createClient } from '@supabase/supabase-js';

// These will be your local development environment values
const supabaseUrl = 'http://localhost:8000';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldi1hbm9uLWtleSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjE0MjEyMzYyLCJleHAiOjE5Mjk3ODgzNjJ9.zqdHRKBYGjJTUf6_H-qBXwMj_stP4aMhzGYYRLsKEQE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 