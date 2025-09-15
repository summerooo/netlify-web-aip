import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { organizationId, userId } = await req.json()

    if (!organizationId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing organizationId or userId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is the organization creator
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('created_by')
      .eq('id', organizationId)
      .single()

    if (orgError) {
      console.error('Error fetching organization:', orgError)
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prevent organization creator from leaving
    if (org.created_by === userId) {
      return new Response(
        JSON.stringify({ error: '组织创建者不能退出自己的组织' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Remove user from organization using service role (bypasses RLS)
    const { error: deleteError } = await supabaseAdmin
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error removing member:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to leave organization' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Successfully left organization' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})