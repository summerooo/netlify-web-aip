import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 删除现有的限制性策略
    await supabaseClient.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;`
    })

    // 创建新的策略：允许用户查看自己的完整资料
    await supabaseClient.rpc('exec_sql', {
      sql: `CREATE POLICY "Users can view own profile" ON public.user_profiles
        FOR SELECT USING (auth.uid() = id);`
    })

    // 创建新的策略：允许查看项目成员和组织成员的基本信息
    await supabaseClient.rpc('exec_sql', {
      sql: `CREATE POLICY "Users can view project members profiles" ON public.user_profiles
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.project_members pm1
            JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id
            WHERE pm1.user_id = auth.uid() AND pm2.user_id = user_profiles.id
          )
          OR
          EXISTS (
            SELECT 1 FROM public.organization_members om1
            JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
            WHERE om1.user_id = auth.uid() AND om2.user_id = user_profiles.id
          )
        );`
    })

    return new Response(
      JSON.stringify({ success: true, message: 'User profiles policy updated successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})