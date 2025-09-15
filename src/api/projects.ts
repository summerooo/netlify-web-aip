import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// 获取用户参与的所有项目
export async function getUserProjects() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('用户未登录')

    // 获取用户参与的项目成员关系
    const { data: memberships, error: membershipError } = await supabase
      .from('project_members')
      .select('project_id, role')
      .eq('user_id', user.id)

    if (membershipError) throw membershipError
    if (!memberships || memberships.length === 0) return []

    // 获取项目详情
    const projectIds = memberships.map(m => m.project_id)
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        *,
        organizations (name)
      `)
      .in('id', projectIds)

    if (projectsError) throw projectsError

    // 合并项目信息和用户角色
    const projectsWithRole = (projects || []).map(project => {
      const membership = memberships.find(m => m.project_id === project.id)
      let userRole = membership?.role || 'member'
      
      // 如果是项目创建者，角色设为 creator
      if (project.created_by === user.id) {
        userRole = 'creator'
      }

      return {
        ...project,
        user_role: userRole,
        organization_name: project.organizations?.name || '未知组织'
      }
    })

    return projectsWithRole
  } catch (error) {
    console.error('获取用户项目失败:', error)
    throw error
  }
}

// 获取组织的项目列表
export async function getOrganizationProjects(organizationId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', organizationId)

  if (error) throw error
  return data || []
}

// 创建项目
export async function createProject(projectData: {
  name: string
  description: string
  status: string
  organization_id: string
  created_by: string
}) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      organization_id: projectData.organization_id,
      created_by: projectData.created_by
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 获取项目详情
export async function getProjectById(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) throw error
  return data
}

// 更新项目
export async function updateProject(projectId: string, updates: {
  name?: string
  description?: string
  status?: string
}) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 获取项目成员
export async function getProjectMembers(projectId: string) {
  // 先获取项目成员
  const { data: members, error: membersError } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)

  if (membersError) throw membersError
  
  if (!members || members.length === 0) {
    return []
  }

  // 获取所有成员的用户ID
  const userIds = members.map(member => member.user_id)
  
  // 尝试查询用户资料，如果失败则使用默认值
  let profiles: any[] = []
  try {
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    if (!profilesError && profilesData) {
      profiles = profilesData
    }
  } catch (error) {
    console.warn('获取用户资料失败，使用默认值:', error)
  }

  // 获取项目任务来计算每个成员的任务数量
  const { data: projectTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('assigned_to')
    .eq('project_id', projectId)

  if (tasksError) {
    console.warn('获取项目任务失败:', tasksError)
  }

  // 合并成员信息和用户资料
  const membersWithProfiles = members.map((member) => {
    const userProfile = profiles?.find(p => p.id === member.user_id)
    
    // 使用full_name作为name，如果没有则使用邮箱前缀，最后才使用用户ID前缀
    const userName = userProfile?.full_name || 
                    (userProfile?.email ? userProfile.email.split('@')[0] : null) ||
                    `用户-${member.user_id.substring(0, 8)}`
    
    const userEmail = userProfile?.email || member.user_id

    // 计算该成员的任务数量
    const taskCount = projectTasks?.filter(task => task.assigned_to === member.user_id).length || 0

    return {
      id: member.id,
      user_id: member.user_id,
      role: member.role,
      name: userName,
      email: userEmail,
      joined_at: member.created_at,
      taskCount: taskCount
    }
  })
  console.log(membersWithProfiles, 'membersWithProfiles')
  return membersWithProfiles
}

// 添加项目成员
export async function addProjectMember(projectId: string, userId: string, role: string = 'member') {
  const { data, error } = await supabase
    .from('project_members')
    .insert({
      project_id: projectId,
      user_id: userId,
      role: role
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 移除项目成员
export async function removeProjectMember(projectId: string, userId: string) {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) throw error
}

// 更新项目成员角色
export async function updateProjectMemberRole(projectId: string, userId: string, role: string) {
  const { data, error } = await supabase
    .from('project_members')
    .update({ role })
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 获取项目任务
export async function getProjectTasks(projectId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  
  // 获取所有分配用户的ID
  const assignedUserIds = [...new Set((data || []).map(task => task.assigned_to).filter(Boolean))]
  
  // 查询分配用户的资料
  let assignedUsersProfiles: any[] = []
  if (assignedUserIds.length > 0) {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', assignedUserIds)

      if (!profilesError && profiles) {
        assignedUsersProfiles = profiles
      }
    } catch (error) {
      console.warn('获取分配用户资料失败，使用默认值:', error)
    }
  }

  // 手动获取分配用户信息
  const tasksWithAssignees = (data || []).map((task) => {
    let assignedUser = null
    if (task.assigned_to) {
      const userProfile = assignedUsersProfiles.find(p => p.id === task.assigned_to)
      assignedUser = {
        display_name: userProfile?.full_name || 
                     (userProfile?.email ? userProfile.email.split('@')[0] : null) ||
                     `用户-${task.assigned_to.substring(0, 8)}`,
        full_name: userProfile?.full_name,
        email: userProfile?.email,
        id: task.assigned_to
      }
    }
    
    return {
      ...task,
      assigned_user: assignedUser
    }
  })
  
  return tasksWithAssignees
}

// 创建任务
export async function createTask(taskData: {
  title: string
  description?: string
  status: string
  priority: string
  project_id: string
  assigned_to?: string
  due_date?: string
}) {
  // 获取当前用户
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('用户未登录')
  }

  // 检查用户是否为项目成员
  const { data: membership, error: memberError } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', taskData.project_id)
    .eq('user_id', user.id)
    .limit(1)

  if (memberError || !membership || membership.length === 0) {
    throw new Error('您不是该项目的成员，无法创建任务')
  }

  // 如果指定了分配用户，验证该用户是否为项目成员
  let finalTaskData = { ...taskData }
  if (taskData.assigned_to) {
    const { data: assigneeMembership, error: assigneeError } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', taskData.project_id)
      .eq('user_id', taskData.assigned_to)
      .limit(1)
    
    // 如果分配的用户不是项目成员，则不设置分配
    if (assigneeError || !assigneeMembership || assigneeMembership.length === 0) {
      console.log('分配的用户不是项目成员，创建未分配任务')
      finalTaskData.assigned_to = undefined
    }
  }

  // 创建任务
  const { data, error } = await supabase
    .from('tasks')
    .insert(finalTaskData)
    .select()

  if (error) throw error
  
  // 返回第一条记录，避免 single() 的错误
  return Array.isArray(data) ? data[0] : data
}

// 更新任务
export async function updateTask(taskId: string, updates: {
  title?: string
  description?: string
  status?: string
  priority?: string
  assigned_to?: string
  due_date?: string
}) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()

  if (error) throw error
  
  // 返回第一条记录，避免 single() 的错误
  return Array.isArray(data) ? data[0] : data
}

// 删除任务
export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) throw error
}

// 邀请项目成员
export async function inviteProjectMember(projectId: string, email: string, role: string = 'member') {
  // 生成邀请令牌
  const invitationToken = uuidv4()
  
  const { data, error } = await supabase
    .from('project_invitations')
    .insert({
      project_id: projectId,
      email: email,
      role: role,
      token: invitationToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天后过期
    })
    .select()
    .single()

  if (error) throw error
  return { ...data, invitationLink: `${window.location.origin}/accept-invitation?token=${invitationToken}&projectId=${projectId}` }
}

// 创建项目邀请
export async function createProjectInvitation(projectId: string, email: string, role: string = 'member') {
  return inviteProjectMember(projectId, email, role)
}

// 获取邀请详情
export async function getInvitationDetails(token: string) {
  try {
    const { data, error } = await supabase
      .from('project_invitations')
      .select('*')
      .eq('token', token)
      .single()
    
    if (error) throw error
    
    // 检查邀请是否过期
    if (new Date(data.expires_at) < new Date()) {
      throw new Error('邀请已过期')
    }
    
    // 手动获取项目信息
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', data.project_id)
      .single()
    
    // 手动获取邀请人信息
    let inviterEmail = '系统邀请'
    if (data.invited_by) {
      const { data: inviter } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('user_id', data.invited_by)
        .single()
      
      inviterEmail = inviter?.email || '系统邀请'
    }
    
    return {
      projectId: data.project_id,
      projectName: project?.name || '未知项目',
      email: data.email,
      inviterEmail,
      role: data.role
    }
  } catch (error) {
    console.error('获取邀请详情失败:', error)
    throw error
  }
}

// 接受项目邀请
export async function acceptProjectInvitation(token: string, projectId: string) {
  try {
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('用户未登录')
    
    // 验证邀请
    const { data: invitation, error: invitationError } = await supabase
      .from('project_invitations')
      .select('*')
      .eq('token', token)
      .eq('project_id', projectId)
      .single()
    
    if (invitationError) throw invitationError
    
    // 检查邀请是否过期
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('邀请已过期')
    }
    
    // 检查邮箱是否匹配
    if (invitation.email && invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
      throw new Error(`此邀请是发送给 ${invitation.email} 的，请使用正确的账号登录后再接受邀请`)
    }
    
    // 检查是否已经是项目成员
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()
    
    if (existingMember) {
      return { success: true, message: '您已经是该项目的成员' }
    }
    
    // 添加为项目成员
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: user.id,
        role: invitation.role
      })
    
    if (memberError) throw memberError
    
    // 删除邀请记录
    await supabase
      .from('project_invitations')
      .delete()
      .eq('token', token)
    
    return { success: true, message: '成功加入项目' }
  } catch (error) {
    console.error('接受邀请失败:', error)
    throw error
  }
}

// 删除项目
export async function deleteProject(projectId: string) {
  try {
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('用户未登录')

    // 获取项目信息
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) throw projectError
    if (!project) throw new Error('项目不存在')

    // 检查权限：项目创建者
    const isProjectCreator = project.created_by === user.id
    
    let isOrgAdmin = false
    if (!isProjectCreator) {
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', project.organization_id)
        .eq('user_id', user.id)
        .single()
      
      isOrgAdmin = memberData?.role === 'admin'
    }
    
    // 检查组织创建者权限
    let isOrgCreator = false
    if (!isProjectCreator && !isOrgAdmin) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('created_by')
        .eq('id', project.organization_id)
        .single()
      
      isOrgCreator = orgData?.created_by === user.id
    }
    
    if (!isProjectCreator && !isOrgAdmin && !isOrgCreator) {
      throw new Error('只有项目创建者或组织管理员才能删除项目')
    }

    // 删除项目（级联删除相关数据）
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
    
    if (deleteError) {
      console.error('删除项目失败:', deleteError)
      throw new Error('删除项目失败，可能由于权限限制')
    }
    
    console.log('项目删除成功')
    return { success: true }
  } catch (error) {
    console.error('删除项目失败:', error)
    throw error
  }
}

// 更新任务状态
export async function updateTaskStatus(taskId: string, status: string) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()

    if (error) throw error

    console.log('任务状态更新成功:', data)
    return data[0]
  } catch (error) {
    console.error('更新任务状态失败:', error)
    throw error
  }
}

// 更新任务负责人
export async function updateTaskAssignee(taskId: string, assigneeId: string | null) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        assigned_to: assigneeId,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()

    if (error) throw error

    console.log('任务负责人更新成功:', data)
    return data[0]
  } catch (error) {
    console.error('更新任务负责人失败:', error)
    throw error
  }
}

// 获取项目活动记录
export async function getProjectActivities(projectId: string, limit: number = 20) {
  try {
    // 首先尝试获取基本活动数据
    const { data: activities, error } = await supabase
      .from('project_activities')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('获取项目活动失败，可能是表不存在:', error)
      return []
    }

    if (!activities || activities.length === 0) {
      return []
    }

    // 获取所有用户ID
    const userIds = [...new Set(activities.map(activity => activity.user_id).filter(Boolean))]
    
    // 尝试获取用户资料
    let userProfiles: any[] = []
    if (userIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', userIds)
        
        userProfiles = profiles || []
      } catch (profileError) {
        console.warn('获取用户资料失败:', profileError)
      }
    }

    // 合并活动和用户信息
    return activities.map(activity => {
      const userProfile = userProfiles.find(p => p.id === activity.user_id)
      return {
        ...activity,
        user_name: userProfile?.full_name || 
                  (userProfile?.email ? userProfile.email.split('@')[0] : null) ||
                  '未知用户'
      }
    })
  } catch (error) {
    console.warn('获取项目活动失败:', error)
    return []
  }
}

// 创建项目活动记录
export async function createProjectActivity(projectId: string, description: string, activityType: string = 'general') {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('project_activities')
      .insert({
        project_id: projectId,
        user_id: user.id,
        description,
        activity_type: activityType
      })

    if (error) {
      console.warn('创建项目活动记录失败:', error)
    }
  } catch (error) {
    console.warn('创建项目活动记录失败:', error)
  }
}