import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://spradrghqzoljgiglwil.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_V2Wod6TRwJ6kBGcNgfeA5A_D8pNVZjd'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)