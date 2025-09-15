import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organizationId } = await req.json()
    
    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: 'Organization ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get organization members with user profiles
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select(`
        *,
        user_profiles:user_id (full_name, email)
      `)
      .eq('organization_id', organizationId)

    if (membersError) {
      throw membersError
    }

    // Format the response with proper user information
    const membersWithUserInfo = members.map(member => ({
      id: member.id,
      organization_id: member.organization_id,
      user_id: member.user_id,
      role: member.role,
      joined_at: member.joined_at,
      email: member.user_profiles?.email || '未知邮箱',
      full_name: member.user_profiles?.full_name || '未知用户'
    }))

    return new Response(
      JSON.stringify({ members: membersWithUserInfo }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})