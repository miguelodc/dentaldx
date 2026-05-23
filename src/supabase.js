import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://feivkhtzxwikjnwjbpay.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlaXZraHR6eHdpa2pud2picGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTAxODYsImV4cCI6MjA5NTA4NjE4Nn0.v8m0AR3SnmJubwooakICbH0_iYqiwDXrbbVMbfJsBjA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
