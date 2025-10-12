// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

// 1. 【請替換為您專案頁面上的真實值！】
const supabaseUrl = 'https://uiawnjxrmoajirgtyehl.supabase.co' 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpYXduanhybW9hamlyZ3R5ZWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODk4NDksImV4cCI6MjA3NTE2NTg0OX0.YQpCuxaLqdM4jnlWi_7IcHs5b0uEe3GOBiwp_98ufjY' 

// 2. 創建 Supabase 客戶端實例
export const supabase = createClient(supabaseUrl, supabaseAnonKey)