import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// 获取用户的所有任务
export async function getUserTasks() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('用户未登录')

    // 获取用户参与的项目ID列表
    const { data: memberships, error: membershipError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)

    if (membershipError) throw membershipError

    const projectIds = memberships?.map(m => m.project_id) || []

    // 获取任务列表（包括用户创建的任务和分配给用户的任务）
    let query = supabase
      .from('tasks')
      .select(`
        *,
        projects (name),
        user_profiles:assigned_to (full_name, avatar_url)
      `)

    // 构建查询条件：用户创建的任务 OR 分配给用户的任务 OR 用户参与项目的任务
    const conditions = []
    
    // 用户创建的任务
    conditions.push(`created_by.eq.${user.id}`)
    
    // 分配给用户的任务
    conditions.push(`assigned_to.eq.${user.id}`)
    
    // 用户参与项目的任务
    if (projectIds.length > 0) {
      conditions.push(`project_id.in.(${projectIds.join(',')})`)
    }

    if (conditions.length > 0) {
      query = query.or(conditions.join(','))
    }

    const { data: tasks, error: tasksError } = await query.order('created_at', { ascending: false })

    if (tasksError) throw tasksError

    // 处理任务数据
    const processedTasks = (tasks || []).map(task => ({
      ...task,
      project_name: task.projects?.name || '无项目',
      assignee_name: task.user_profiles?.full_name || '',
      assignee_avatar: task.user_profiles?.avatar_url || ''
    }))

    return processedTasks
  } catch (error) {
    console.error('获取用户任务失败:', error)
    throw error
  }
}

// 创建任务
export async function createTask(taskData: {
  title: string
  description?: string
  project_id?: string
  priority: string
  status: string
  due_date?: string
  assigned_to?: string
}) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('用户未登录')

    const taskId = uuidv4()
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        id: taskId,
        title: taskData.title,
        description: taskData.description,
        project_id: taskData.project_id || null,
        priority: taskData.priority,
        status: taskData.status,
        due_date: taskData.due_date || null,
        assigned_to: taskData.assigned_to || user.id,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('创建任务失败:', error)
    throw error
  }
}

// 更新任务
export async function updateTask(taskId: string, updates: {
  title?: string
  description?: string
  project_id?: string
  priority?: string
  status?: string
  due_date?: string
  assigned_to?: string
}) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('用户未登录')

    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('更新任务失败:', error)
    throw error
  }
}

// 删除任务
export async function deleteTask(taskId: string) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('用户未登录')

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('删除任务失败:', error)
    throw error
  }
}

// 标记任务为完成
export async function markTaskAsCompleted(taskId: string) {
  try {
    return await updateTask(taskId, { status: '已完成' })
  } catch (error) {
    console.error('标记任务完成失败:', error)
    throw error
  }
}

// 获取项目的任务统计
export async function getProjectTaskStats(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('status')
      .eq('project_id', projectId)

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      pending: data?.filter(t => t.status === '待办').length || 0,
      inProgress: data?.filter(t => t.status === '进行中').length || 0,
      completed: data?.filter(t => t.status === '已完成').length || 0
    }

    return stats
  } catch (error) {
    console.error('获取项目任务统计失败:', error)
    throw error
  }
}