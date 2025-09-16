import { supabase } from '../lib/supabase'

// 获取用户统计数据
export async function getUserStats(userId: string) {
  try {
    // 获取组织数量
    const { data: organizations, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)

    if (orgError) {
      console.warn('获取组织数据失败:', orgError)
      // 如果是权限问题，返回空数据而不是抛出错误
      return {
        organizations: 0,
        projects: 0,
        tasks: 0,
        documents: 0
      }
    }

    const organizationIds = organizations?.map(org => org.organization_id) || []

    // 获取用户参与的项目数量
    const { data: userProjects, error: projectError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId)

    let projectCount = 0
    if (!projectError && userProjects) {
      projectCount = userProjects.length
    } else if (projectError) {
      console.warn('获取用户项目数据失败:', projectError)
    }

    // 获取待办任务数量 (简化查询，避免中文状态问题)
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('id')
      .eq('assigned_to', userId)

    if (taskError) {
      console.warn('获取任务数据失败:', taskError)
    }

    // 获取知识库文档数量（复用已获取的项目数据）
    let knowledgeCount = 0
    if (!projectError && userProjects && userProjects.length > 0) {
      const projectIds = userProjects.map(p => p.project_id)
      
      // 获取这些项目的知识库数量
      const { data: knowledgeItems, error: knowledgeError } = await supabase
        .from('knowledge_items')
        .select('id')
        .in('project_id', projectIds)

      if (!knowledgeError && knowledgeItems) {
        knowledgeCount = knowledgeItems.length
      } else if (knowledgeError) {
        console.warn('获取知识库数据失败:', knowledgeError)
      }
    }

    return {
      organizations: organizations?.length || 0,
      projects: projectCount,
      tasks: tasks?.length || 0,
      documents: knowledgeCount
    }
  } catch (error) {
    console.error('获取用户统计数据失败:', error)
    // 返回默认值而不是抛出错误
    return {
      organizations: 0,
      projects: 0,
      tasks: 0,
      documents: 0
    }
  }
}

// 获取最近项目
export async function getRecentProjects(userId: string, limit: number = 5) {
  try {
    // 首先获取用户所属的组织ID列表
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)

    if (memberError) {
      console.warn('获取组织成员数据失败:', memberError)
      return []
    }
    
    const organizationIds = memberData?.map(item => item.organization_id) || []
    
    if (organizationIds.length === 0) {
      console.log('用户还没有加入任何组织')
      return []
    }

    // 然后获取这些组织的项目
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        organization:organizations(name)
      `)
      .in('organization_id', organizationIds)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('获取项目数据失败:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('获取最近项目失败:', error)
    return []
  }
}

// 获取最近活动
export async function getRecentActivities(userId: string, limit: number = 10) {
  // 这里可以从多个表获取活动数据，暂时返回模拟数据
  return [
    {
      id: 1,
      description: '创建了新项目"移动应用开发"',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      description: '完成了任务"用户界面设计"',
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ]
}
