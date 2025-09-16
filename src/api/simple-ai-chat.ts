import { supabase } from '../lib/supabase'

// 简单AI聊天接口
export interface SimpleChatRequest {
  message: string
  project_id?: string
}

export interface SimpleChatResponse {
  response: string
  timestamp: string
}

// 发送AI聊天消息
export async function sendSimpleAIMessage(message: string, projectId?: string): Promise<SimpleChatResponse> {
  try {
    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    // 获取n8n webhook URL
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL
    if (!webhookUrl) {
      throw new Error('AI聊天服务未配置')
    }

    // 准备请求数据
    const requestData: SimpleChatRequest = {
      message,
      project_id: projectId
    }

    // 发送请求到n8n工作流
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
      signal: AbortSignal.timeout(parseInt(import.meta.env.VITE_AI_CHAT_TIMEOUT || '10000'))
    })

    if (!response.ok) {
      throw new Error(`AI服务请求失败: ${response.status}`)
    }

    const result = await response.json()
    
    // 调试模式下打印响应
    if (import.meta.env.VITE_AI_CHAT_DEBUG === 'true') {
      console.log('AI Chat Response:', result)
    }

    return result

  } catch (error) {
    console.error('AI聊天服务错误:', error)
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络设置')
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试')
    }
    
    throw error
  }
}

// 获取项目列表（用于聊天上下文选择）
export async function getUserProjects() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    // 获取用户参与的项目
    const { data: memberships, error: membershipError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)

    if (membershipError) throw membershipError
    if (!memberships || memberships.length === 0) return []

    // 获取项目详情
    const projectIds = memberships.map(m => m.project_id)
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, description')
      .in('id', projectIds)

    if (projectsError) throw projectsError

    return projects || []

  } catch (error) {
    console.error('获取项目列表失败:', error)
    return []
  }
}