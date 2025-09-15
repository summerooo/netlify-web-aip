import { supabase } from '../lib/supabase'

// 生成UUID的兼容函数
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // 兼容性实现
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 获取用户的组织列表
export async function getUserOrganizations() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('用户未登录')

  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      organizations (*)
    `)
    .eq('user_id', user.id)

  if (error) throw error
  
  if (!data) return []

  // 为每个组织获取项目数量和成员数量
  const organizationsWithStats = await Promise.all(
    data.map(async (item) => {
      const orgId = item.organizations.id
      
      // 获取项目数量
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
      
      // 获取成员数量
      const { count: memberCount } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)

      return {
        ...item.organizations,
        role: item.role,
        userRole: item.role, // 添加 userRole 字段供前端使用
        joined_at: item.joined_at,
        project_count: projectCount || 0,
        member_count: memberCount || 0
      }
    })
  )

  return organizationsWithStats
}

// 创建组织
export async function createOrganization(name: string, description: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('用户未登录')

  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name,
      description,
      created_by: user.id
    })
    .select()
    .single()

  if (error) throw error

  // 将创建者添加为组织管理员
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: data.id,
      user_id: user.id,
      role: 'admin'
    })

  if (memberError) throw memberError
  return data
}

// 获取组织详情
export async function getOrganization(id: string) {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// 获取组织详情 (别名函数，保持向后兼容)
export async function getOrganizationById(id: string) {
  return getOrganization(id)
}

// 更新组织信息
export async function updateOrganization(id: string, updates: { name?: string, description?: string }) {
  console.log('API updateOrganization called with:', { id, updates })
  
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// 获取组织成员 - 参考项目成员的获取方式
export async function getOrganizationMembers(organizationId: string) {
  try {
    // 先获取组织成员
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)

    if (membersError) throw membersError
    
    if (!members || members.length === 0) {
      return []
    }

    // 获取所有成员的用户ID
    const userIds = members.map(member => member.user_id)
    
    // 使用service role key来绕过RLS查询用户资料
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    if (profilesError) {
      console.warn('获取用户资料失败:', profilesError)
    }

    // 合并成员信息和用户资料
    const membersWithProfiles = members.map((member) => {
      const userProfile = profiles?.find(p => p.id === member.user_id)
      
      // 使用full_name作为name，如果没有则使用邮箱前缀，最后才使用用户ID前缀
      const userName = userProfile?.full_name || 
                      (userProfile?.email ? userProfile.email.split('@')[0] : null) ||
                      `用户-${member.user_id.substring(0, 8)}`
      
      const userEmail = userProfile?.email || member.user_id

      return {
        id: member.id,
        organization_id: member.organization_id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        name: userName,
        email: userEmail,
        full_name: userName
      }
    })

    console.log('组织成员数据:', membersWithProfiles)
    return membersWithProfiles

  } catch (error) {
    console.error('获取组织成员失败:', error)
    throw error
  }
}

// 邀请成员加入组织
export async function inviteToOrganization(organizationId: string, email: string, role: string = 'member') {
  const { data, error } = await supabase.functions.invoke('send-invitation-email', {
    body: {
      organizationId,
      email,
      role
    }
  })

  if (error) throw error
  return data
}

// 创建组织邀请 - 支持通用邀请链接
export async function createOrganizationInvitation(organizationId: string, role: string = 'member', inviterEmail: string = '', email: string = '') {
  try {
    // 生成邀请token
    const invitationToken = generateUUID()
    
    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')
    
    // 创建邀请记录
    const { data, error } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: organizationId,
        invited_by: user.id,
        role: role,
        token: invitationToken,
        email: email || null, // 如果没有邮箱则为null，表示通用邀请
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天后过期
      })
      .select()
      .single()

    if (error) throw error
    
    return {
      ...data,
      invitationToken: invitationToken,
      token: invitationToken
    }
  } catch (error) {
    console.error('创建组织邀请失败:', error)
    throw error
  }
}

// 生成组织邀请链接
export async function generateOrganizationInvitationLink(organizationId: string, token: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
  return `${origin}/accept-organization-invitation?token=${token}&organizationId=${organizationId}`
}

// 获取组织邀请详情
export async function getOrganizationInvitationDetails(token: string) {
  try {
    console.log('查询邀请token:', token)
    
    // 首先查询基本邀请信息
    const { data: invitation, error: invitationError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (invitationError) {
      console.error('查询邀请失败:', invitationError)
      throw new Error('邀请不存在或已失效')
    }

    console.log('找到邀请:', invitation)

    // 检查邀请状态
    if (invitation.status !== 'pending') {
      throw new Error('邀请已被使用或已取消')
    }

    // 检查是否过期
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('邀请已过期')
    }

    // 获取组织信息
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, description')
      .eq('id', invitation.organization_id)
      .single()

    if (orgError) {
      console.error('获取组织信息失败:', orgError)
      throw new Error('组织不存在')
    }

    // 尝试获取邀请者信息（可选，忽略权限错误）
    let inviterInfo = null
    if (invitation.invited_by) {
      try {
        const { data: inviter } = await supabase
          .from('user_profiles')
          .select('full_name, email')
          .eq('id', invitation.invited_by)
          .single()
        
        inviterInfo = inviter
      } catch (profileError) {
        console.warn('无法获取邀请者信息，可能是权限限制:', profileError)
        // 如果无法获取用户资料，使用默认值
        inviterInfo = { full_name: '系统用户', email: '' }
      }
    }

    return {
      ...invitation,
      organization: organization,
      organizations: organization,
      inviter: inviterInfo,
      user_profiles: inviterInfo,
      // 添加Vue组件期望的字段名
      organizationName: organization?.name || '未知组织',
      inviterEmail: inviterInfo?.email || inviterInfo?.full_name || '未知邀请人'
    }
  } catch (error) {
    console.error('获取邀请详情失败:', error)
    throw error
  }
}

// 接受组织邀请
export async function acceptOrganizationInvitation(token: string, organizationId?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    // 获取邀请详情
    const invitation = await getOrganizationInvitationDetails(token)
    
    // 检查用户是否已经是组织成员
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      throw new Error('您已经是该组织的成员')
    }

    // 使用 RPC 函数来安全地添加组织成员，避免触发器问题
    const { data: rpcResult, error: rpcError } = await supabase.rpc('accept_organization_invitation_safe', {
      invitation_token: token,
      user_id: user.id
    })

    if (rpcError) {
      console.error('RPC调用失败，回退到直接插入:', rpcError)
      
      // 回退到直接插入
      console.log('准备添加用户到组织:', {
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role
      })
      
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: user.id,
          role: invitation.role
        })

      if (memberError) {
        console.error('添加组织成员失败:', memberError)
        throw new Error(`添加成员失败: ${memberError.message}`)
      }
      
      console.log('成功添加用户到组织')

      // 更新邀请状态
      const { error: updateError } = await supabase
        .from('organization_invitations')
        .update({ status: 'accepted' })
        .eq('token', token)

      if (updateError) throw updateError
    }

    return invitation.organizations
  } catch (error) {
    console.error('接受邀请失败:', error)
    throw error
  }
}

// 移除组织成员
export async function removeOrganizationMember(organizationId: string, userId: string) {
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId)

  if (error) throw error
}

// 移除成员 (别名函数，保持向后兼容)
export async function removeMember(organizationId: string, userId: string) {
  return removeOrganizationMember(organizationId, userId)
}

// 更新成员角色
export async function updateMemberRole(organizationId: string, userId: string, role: string) {
  const { data, error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 离开组织
export async function leaveOrganization(organizationId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('用户未登录')

  try {
    // 尝试使用 Edge Function
    const { data, error } = await supabase.functions.invoke('leave-organization', {
      body: { 
        organizationId,
        userId: user.id 
      }
    })

    if (error) throw error
    return data
  } catch (functionError) {
    console.warn('Edge Function 调用失败，使用直接API:', functionError)
    
    // 备用方案：直接使用API
    // 首先检查用户是否是组织创建者
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('created_by')
      .eq('id', organizationId)
      .single()

    if (orgError) throw new Error('组织不存在')
    
    if (org.created_by === user.id) {
      throw new Error('组织创建者不能退出自己的组织')
    }

    // 移除用户的组织成员身份
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)

    if (deleteError) throw new Error('退出组织失败')
    
    return { success: true, message: '成功退出组织' }
  }
}

// 获取组织项目
export async function getOrganizationProjects(organizationId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// 删除组织
export async function deleteOrganization(organizationId: string) {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', organizationId)

  if (error) throw error
}