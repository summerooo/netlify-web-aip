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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { message, context_type, project_id, organization_id } = await req.json()

    if (!message || !context_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get context information based on type
    let contextInfo = ''
    
    if (context_type === 'project' && project_id) {
      const { data: project } = await supabaseClient
        .from('projects')
        .select(`
          *,
          organization:organizations(*),
          tasks(*),
          project_members(*, user_profiles(*))
        `)
        .eq('id', project_id)
        .single()

      if (project) {
        contextInfo = `
项目信息：
- 项目名称：${project.name}
- 项目描述：${project.description || '无'}
- 项目状态：${project.status}
- 组织：${project.organization?.name}
- 任务数量：${project.tasks?.length || 0}
- 团队成员：${project.project_members?.length || 0}人

最近任务：
${project.tasks?.slice(0, 5).map((task: any) => `- ${task.title} (${task.status})`).join('\n') || '暂无任务'}
        `
      }
    } else if (context_type === 'organization' && organization_id) {
      const { data: organization } = await supabaseClient
        .from('organizations')
        .select(`
          *,
          projects(*),
          organization_members(*, user_profiles(*))
        `)
        .eq('id', organization_id)
        .single()

      if (organization) {
        contextInfo = `
组织信息：
- 组织名称：${organization.name}
- 组织描述：${organization.description || '无'}
- 项目数量：${organization.projects?.length || 0}
- 成员数量：${organization.organization_members?.length || 0}人

项目列表：
${organization.projects?.slice(0, 5).map((project: any) => `- ${project.name} (${project.status})`).join('\n') || '暂无项目'}
        `
      }
    }

    // Generate AI response (这里使用模拟响应，实际应该调用AI API)
    const aiResponse = await generateAIResponse(message, contextInfo, context_type)

    // Save chat history
    const { error: saveError } = await supabaseClient
      .from('chat_history')
      .insert({
        user_id: user.id,
        project_id: project_id || null,
        organization_id: organization_id || null,
        message,
        response: aiResponse,
        context_type
      })

    if (saveError) {
      console.error('Error saving chat history:', saveError)
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in ai-chat function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function generateAIResponse(message: string, contextInfo: string, contextType: string): Promise<string> {
  // 这里应该调用实际的AI API（如OpenAI、Claude等）
  // 现在使用模拟响应
  
  const responses = {
    project: [
      "根据您的项目情况，我建议您可以：\n1. 优化任务分配，确保工作负载均衡\n2. 定期进行项目进度回顾\n3. 加强团队沟通协作",
      "我注意到您的项目进展良好。建议关注以下几点：\n1. 风险识别和预防\n2. 质量控制检查点\n3. 里程碑达成情况",
      "基于项目数据分析，我推荐：\n1. 设置更明确的任务优先级\n2. 建立更好的进度跟踪机制\n3. 优化团队协作流程"
    ],
    organization: [
      "从组织层面来看，我建议：\n1. 建立跨项目的资源协调机制\n2. 制定统一的项目管理标准\n3. 加强知识共享和最佳实践传播",
      "您的组织发展很好，建议考虑：\n1. 项目组合管理优化\n2. 人才培养和技能提升\n3. 创新项目的孵化机制",
      "基于组织数据，我推荐：\n1. 建立项目成功率评估体系\n2. 优化资源分配策略\n3. 加强组织文化建设"
    ],
    task: [
      "关于任务管理，我建议：\n1. 明确任务依赖关系\n2. 设置合理的截止日期\n3. 定期进行任务状态更新",
      "为了提高任务执行效率：\n1. 将大任务分解为小任务\n2. 设置任务优先级\n3. 建立任务完成标准",
      "任务管理优化建议：\n1. 使用看板方法可视化进度\n2. 建立任务反馈机制\n3. 定期进行任务回顾总结"
    ]
  }

  const contextResponses = responses[contextType as keyof typeof responses] || responses.project
  const randomResponse = contextResponses[Math.floor(Math.random() * contextResponses.length)]

  // 如果有上下文信息，添加个性化内容
  if (contextInfo.trim()) {
    return `${randomResponse}\n\n基于当前${contextType === 'project' ? '项目' : '组织'}的具体情况，我还注意到您可以进一步优化工作流程。如果您需要更详细的建议，请告诉我具体的问题或挑战。`
  }

  return randomResponse
}

/* Deno.env.get('SUPABASE_URL') ?? ''
   Deno.env.get('SUPABASE_ANON_KEY') ?? '' */