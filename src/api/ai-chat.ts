import { supabase } from '../lib/supabase'

// AI聊天服务接口
export interface AIChatRequest {
  message: string
  user_id?: string
  project_id?: string
  organization_id?: string
  context_type?: 'project' | 'organization' | 'task' | 'general'
}

export interface AIChatResponse {
  response: string
  timestamp: string
  context_type?: string
  tokens_used?: number
}

// 发送AI聊天消息
export async function sendAIMessage(request: AIChatRequest): Promise<AIChatResponse> {
  try {
    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    // 准备请求数据
    const requestData = {
      ...request,
      user_id: user.id,
      context_type: request.context_type || 'general'
    }

    // 获取n8n webhook URL
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL
    if (!webhookUrl) {
      throw new Error('AI服务未配置，请联系管理员')
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
      throw new Error(`AI服务请求失败: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    // 调试模式下打印响应
    if (import.meta.env.VITE_AI_CHAT_DEBUG === 'true') {
      console.log('AI Chat Response:', result)
    }

    return result

  } catch (error) {
    console.error('AI聊天服务错误:', error)
    
    // 如果是网络错误或超时，返回友好的错误消息
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络设置')
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试')
    }
    
    throw error
  }
}

// 获取聊天历史
export async function getChatHistory(options: {
  project_id?: string
  organization_id?: string
  limit?: number
  offset?: number
} = {}): Promise<any[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    let query = supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 添加过滤条件
    if (options.project_id) {
      query = query.eq('project_id', options.project_id)
    }
    
    if (options.organization_id) {
      query = query.eq('organization_id', options.organization_id)
    }

    // 添加分页
    if (options.limit) {
      query = query.limit(options.limit)
    }
    
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data || []

  } catch (error) {
    console.error('获取聊天历史失败:', error)
    throw error
  }
}

// 删除聊天历史
export async function deleteChatHistory(chatId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('id', chatId)
      .eq('user_id', user.id) // 确保只能删除自己的聊天记录

    if (error) {
      throw error
    }

  } catch (error) {
    console.error('删除聊天历史失败:', error)
    throw error
  }
}

// 清空聊天历史
export async function clearChatHistory(options: {
  project_id?: string
  organization_id?: string
} = {}): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    let query = supabase
      .from('chat_history')
      .delete()
      .eq('user_id', user.id)

    // 添加过滤条件
    if (options.project_id) {
      query = query.eq('project_id', options.project_id)
    }
    
    if (options.organization_id) {
      query = query.eq('organization_id', options.organization_id)
    }

    const { error } = await query

    if (error) {
      throw error
    }

  } catch (error) {
    console.error('清空聊天历史失败:', error)
    throw error
  }
}

// 获取AI使用统计
export async function getAIUsageStats(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<{
  total_messages: number
  total_tokens: number
  avg_tokens_per_message: number
  most_active_context: string
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    // 计算时间范围
    const now = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const { data, error } = await supabase
      .from('chat_history')
      .select('tokens_used, context_type')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return {
        total_messages: 0,
        total_tokens: 0,
        avg_tokens_per_message: 0,
        most_active_context: 'general'
      }
    }

    // 计算统计数据
    const totalMessages = data.length
    const totalTokens = data.reduce((sum, item) => sum + (item.tokens_used || 0), 0)
    const avgTokensPerMessage = totalMessages > 0 ? Math.round(totalTokens / totalMessages) : 0

    // 找出最活跃的上下文类型
    const contextCounts = data.reduce((acc, item) => {
      acc[item.context_type] = (acc[item.context_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostActiveContext = Object.entries(contextCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'general'

    return {
      total_messages: totalMessages,
      total_tokens: totalTokens,
      avg_tokens_per_message: avgTokensPerMessage,
      most_active_context: mostActiveContext
    }

  } catch (error) {
    console.error('获取AI使用统计失败:', error)
    throw error
  }
}