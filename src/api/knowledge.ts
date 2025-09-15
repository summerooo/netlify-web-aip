import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export interface KnowledgeItem {
  id: string
  title: string
  description?: string
  content?: string
  type: 'document' | 'link' | 'note'
  url?: string
  tags?: string[]
  project_id: string
  created_by: string
  created_at: string
  updated_at: string
  created_by_name?: string
}

// 获取项目知识库列表
export async function getProjectKnowledge(projectId: string): Promise<KnowledgeItem[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('用户未登录')

    // 先检查用户是否为项目成员
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('id, role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .limit(1)

    if (membershipError) {
      console.error('检查项目成员关系失败:', membershipError)
      throw new Error('无法验证项目成员身份')
    }

    if (!membership || membership.length === 0) {
      console.log('用户不是项目成员，无法访问知识库')
      return []
    }

    console.log('用户是项目成员，角色:', membership[0].role)

    const { data, error } = await supabase
      .from('knowledge_items')
      .select(`
        *,
        user_profiles:created_by (full_name)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取知识库数据失败:', error)
      throw error
    }

    // 处理数据，添加创建者姓名
    const processedData = (data || []).map(item => ({
      ...item,
      created_by_name: item.user_profiles?.full_name || '未知用户',
      tags: Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : [])
    }))

    console.log(`为项目 ${projectId} 加载了 ${processedData.length} 个知识库项目`)
    return processedData
  } catch (error) {
    console.error('获取项目知识库失败:', error)
    throw error
  }
}

// 创建知识库项目
export async function createKnowledgeItem(data: {
  title: string
  description?: string
  content?: string
  type: 'document' | 'link' | 'note'
  url?: string
  tags?: string[]
  project_id: string
}): Promise<KnowledgeItem> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('用户未登录')

    // 检查用户是否为项目成员
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('id, role')
      .eq('project_id', data.project_id)
      .eq('user_id', user.id)
      .limit(1)

    if (membershipError) {
      console.error('检查项目成员关系失败:', membershipError)
      throw new Error('无法验证项目成员身份')
    }

    if (!membership || membership.length === 0) {
      throw new Error('您不是该项目的成员，无法创建知识库项目')
    }

    const itemId = uuidv4()
    const now = new Date().toISOString()

    const { data: result, error } = await supabase
      .from('knowledge_items')
      .insert({
        id: itemId,
        title: data.title,
        description: data.description,
        content: data.content,
        type: data.type,
        url: data.url,
        tags: data.tags || [],
        project_id: data.project_id,
        created_by: user.id,
        created_at: now,
        updated_at: now
      })
      .select(`
        *,
        user_profiles:created_by (full_name)
      `)
      .single()

    if (error) {
      console.error('创建知识库项目失败:', error)
      throw error
    }

    console.log('成功创建知识库项目:', result.title)
    return {
      ...result,
      created_by_name: result.user_profiles?.full_name || '未知用户',
      tags: Array.isArray(result.tags) ? result.tags : (result.tags ? [result.tags] : [])
    }
  } catch (error) {
    console.error('创建知识库项目失败:', error)
    throw error
  }
}

// 更新知识库项目
export async function updateKnowledgeItem(
  itemId: string,
  updates: {
    title?: string
    description?: string
    content?: string
    type?: 'document' | 'link' | 'note'
    url?: string
    tags?: string[]
  }
): Promise<KnowledgeItem> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('用户未登录')

    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    // 处理 tags 字段
    if (updates.tags !== undefined) {
      updateData.tags = updates.tags || []
    }

    const { data: result, error } = await supabase
      .from('knowledge_items')
      .update(updateData)
      .eq('id', itemId)
      .select(`
        *,
        user_profiles:created_by (full_name)
      `)
      .single()

    if (error) throw error

    return {
      ...result,
      created_by_name: result.user_profiles?.full_name || '未知用户',
      tags: Array.isArray(result.tags) ? result.tags : (result.tags ? [result.tags] : [])
    }
  } catch (error) {
    console.error('更新知识库项目失败:', error)
    throw error
  }
}

// 删除知识库项目
export async function deleteKnowledgeItem(itemId: string): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('用户未登录')

    const { error } = await supabase
      .from('knowledge_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error
  } catch (error) {
    console.error('删除知识库项目失败:', error)
    throw error
  }
}

// 搜索知识库项目
export async function searchKnowledgeItems(
  projectId: string,
  query: string
): Promise<KnowledgeItem[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('用户未登录')

    const { data, error } = await supabase
      .from('knowledge_items')
      .select(`
        *,
        user_profiles:created_by (full_name)
      `)
      .eq('project_id', projectId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error

    // 处理数据，添加创建者姓名
    const processedData = (data || []).map(item => ({
      ...item,
      created_by_name: item.user_profiles?.full_name || '未知用户',
      tags: Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : [])
    }))

    return processedData
  } catch (error) {
    console.error('搜索知识库项目失败:', error)
    throw error
  }
}

// 根据标签获取知识库项目
export async function getKnowledgeItemsByTag(
  projectId: string,
  tag: string
): Promise<KnowledgeItem[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('用户未登录')

    const { data, error } = await supabase
      .from('knowledge_items')
      .select(`
        *,
        user_profiles:created_by (full_name)
      `)
      .eq('project_id', projectId)
      .like('tags', `%"${tag}"%`)
      .order('created_at', { ascending: false })

    if (error) throw error

    // 处理数据，添加创建者姓名
    const processedData = (data || []).map(item => ({
      ...item,
      created_by_name: item.user_profiles?.full_name || '未知用户',
      tags: Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : [])
    }))

    return processedData
  } catch (error) {
    console.error('根据标签获取知识库项目失败:', error)
    throw error
  }
}