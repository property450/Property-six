// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

<<<<<<< HEAD
// ✅ 从环境变量读取（推荐：Vercel 环境配置）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ 创建客户端
=======
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

>>>>>>> 07f41405a46cc64a0a6a5fe1bdfd45263b994419
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
