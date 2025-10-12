// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

// 1. 【請替換為您專案頁面上的真實值！】
const supabaseUrl = 'https://uiawnjxrmoajirgtyehl.supabase.co' 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpYXduanhybW9hamlyZ3R5ZWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODk4NDksImV4cCI6MjA3NTE2NTg0OX0.YQpCuxaLqdM4jnlWi_7IcHs5b0uEe3GOBiwp_98ufjY' 
// 🎯您的 Service Role Secret Key!!!!
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpYXduanhybW9hamlyZ3R5ZWhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU4OTg0OSwiZXhwIjoyMDc1MTY1ODQ5fQ.HZJY4zKzGYS8M7x4Uy97IDadUSCX5mZyd5s5U-yIC4s'
// 2. 創建 Supabase 客戶端實例
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
// 🎯 【新增】：匯出一個使用服務密鑰的客戶端
export const supabaseService = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        persistSession: false, // 服務密鑰不需要持久化 Session
        autoRefreshToken: false,
    }
});