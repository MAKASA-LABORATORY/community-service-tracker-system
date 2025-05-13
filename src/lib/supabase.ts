import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export type Student = {
  id: string
  created_at: string
  name: string
  student_id: string
  email: string
  total_hours: number
  remaining_hours: number
  status: 'active' | 'inactive' | 'pending' | 'completed'
  program: string
  year: number
}

export type ServiceHours = {
  id: string
  created_at: string
  student_id: string
  hours: number
  service_type: string
  date: string
  description: string
} 