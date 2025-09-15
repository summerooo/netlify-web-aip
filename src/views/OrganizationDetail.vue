<template>
  <div class="organization-detail">
    <el-container>
      <div class="back-section">
          <el-button 
            link
            size="small"
            @click="$router.back()"
            class="back-btn"
          >
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      <el-header class="header">
        
        <div class="header-content">
          <div class="title-row">
            <h1>{{ organization?.name }}</h1>
            <div class="header-actions">
              <el-button 
                v-if="isOrgAdmin" 
                type="primary" 
                @click="showCreateProjectDialog = true"
              >
                <el-icon><Plus /></el-icon>
                创建项目
              </el-button>
            </div>
          </div>
          <p class="org-description">{{ organization?.description || '暂无描述' }}</p>
        </div>
      </el-header>

      <el-main>
        <el-tabs v-model="activeTab" class="org-tabs">
          <el-tab-pane label="项目" name="projects">
            <div class="projects-section">
              <div v-if="loading" class="loading">
                <el-skeleton :rows="3" animated />
              </div>
              <div v-else-if="projects.length === 0" class="empty-state">
                <el-empty description="暂无项目">
                  <el-button 
                    v-if="isOrgAdmin" 
                    type="primary" 
                    @click="showCreateProjectDialog = true"
                  >
                    创建第一个项目
                  </el-button>
                </el-empty>
              </div>
              <div v-else class="projects-grid">
                <el-card 
                  v-for="project in projects" 
                  :key="project.id"
                  class="project-card"
                  shadow="hover"
                  @click="$router.push(`/projects/${project.id}`)"
                >
                  <div class="project-header">
                    <h3>{{ project.name }}</h3>
                    <div class="project-status-actions">
                      <el-select 
                        v-model="project.status" 
                        size="small"
                        @click.stop
                        @change="(newStatus: string) => updateProjectStatus(project.id, newStatus)"
                        class="status-select"
                      >
                        <el-option label="计划中" value="计划中" />
                        <el-option label="进行中" value="进行中" />
                        <el-option label="已完成" value="已完成" />
                        <el-option label="已暂停" value="已暂停" />
                      </el-select>
                    </div>
                  </div>
                  <p class="project-desc">{{ project.description || '暂无描述' }}</p>
                  <div class="project-meta">
                    <span>创建时间: {{ formatDate(project.created_at) }}</span>
                  </div>
                </el-card>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="成员" name="members">
            <div class="members-section">
              <div class="members-header">
                <h3>组织成员</h3>
                <el-button 
                  v-if="canManageOrg"
                  type="primary" 
                  @click="showInviteDialog = true"
                >
                  <el-icon><User /></el-icon>
                  邀请成员
                </el-button>
              </div>
              
              <el-table :data="members" style="width: 100%">
                <el-table-column label="姓名">
                  <template #default="{ row }">
                    {{ row.full_name || row.name || row.email || '未知用户' }}
                  </template>
                </el-table-column>
                <el-table-column label="邮箱">
                  <template #default="{ row }">
                    {{ row.email || '未知邮箱' }}
                  </template>
                </el-table-column>
                <el-table-column prop="role" label="角色">
                  <template #default="{ row }">
                    <el-tag :type="row.role === 'admin' ? 'danger' : 'info'">
                      {{ row.role === 'admin' ? '管理员' : '成员' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="joined_at" label="加入时间">
                  <template #default="{ row }">
                    {{ formatDate(row.joined_at) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120">
                  <template #default="{ row }">
                    <el-button 
                      v-if="canManageOrg && row.role !== 'admin' && row.user_id !== authStore.user?.id"
                      type="danger" 
                      size="small"
                      @click="removeMember(row.id)"
                    >
                      移除
                    </el-button>
                    <span v-else-if="!canManageOrg" class="no-permission-text">
                      {{ row.user_id === authStore.user?.id ? '自己' : '无权限' }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>

          <el-tab-pane label="设置" name="settings">
            <div class="settings-section">
              <el-form :model="settingsForm" label-width="100px">
                <el-form-item label="组织名称">
                  <el-input v-model="settingsForm.name" :disabled="!canManageOrg" />
                </el-form-item>
                <el-form-item label="组织描述">
                  <el-input 
                    v-model="settingsForm.description" 
                    type="textarea" 
                    :rows="3"
                    :disabled="!canManageOrg"
                  />
                </el-form-item>
                <el-form-item v-if="canManageOrg">
                  <el-button type="primary" @click="updateOrganizationSettings">
                    保存设置
                  </el-button>
                </el-form-item>
                <el-form-item v-else>
                  <el-alert
                    title="只有组织创建者或管理员才能修改组织设置"
                    type="info"
                    :closable="false"
                  />
                </el-form-item>
              </el-form>
              
              <!-- 危险操作区域 -->
              <div class="danger-zone" v-if="!isOrgCreator">
                <h3>危险操作</h3>
                <div class="danger-actions">
                  <p>退出组织后，您将失去对该组织及其项目的访问权限。</p>
                  <el-button type="danger" @click="showLeaveDialog = true">
                    退出组织
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>

    <!-- 创建项目对话框 -->
    <el-dialog 
      v-model="showCreateProjectDialog" 
      title="创建项目" 
      width="500px"
    >
      <el-form 
        ref="projectFormRef"
        :model="projectForm" 
        :rules="projectRules"
        label-width="80px"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input 
            v-model="projectForm.description" 
            type="textarea" 
            :rows="3"
          />
        </el-form-item>

      </el-form>
      <template #footer>
        <el-button @click="showCreateProjectDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleCreateProject"
          :loading="creatingProject"
        >
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 邀请成员对话框 -->
    <el-dialog 
      v-model="showInviteDialog" 
      title="邀请成员" 
      width="400px"
    >
      <el-form :model="inviteForm" label-width="80px">
        <el-form-item label="邀请角色">
          <el-select v-model="inviteForm.role" style="width: 100%">
            <el-option label="成员" value="member" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-alert
            title="邀请说明"
            description="生成邀请链接后，任何通过此链接访问的用户都可以加入组织"
            type="info"
            :closable="false"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInviteDialog = false">取消</el-button>
        <el-button type="primary" @click="inviteMember">邀请</el-button>
      </template>
    </el-dialog>

    <!-- 邀请链接对话框 -->
    <el-dialog 
      v-model="showInviteLinkDialog" 
      title="成员邀请链接" 
      width="500px"
    >
      <div class="invitation-link-dialog">
        <p>邀请已发送，请复制以下链接发送给被邀请人：</p>
        
        <div class="invitation-link-container">
          <el-input 
            v-model="invitationLink" 
            readonly 
            class="invitation-link-input"
          >
            <template #append>
              <el-button 
                @click="copyInvitationLink"
                :loading="copyingLink"
              >
                复制链接
              </el-button>
            </template>
          </el-input>
        </div>

        <div class="invitation-info" v-if="invitationInfo">
          <p><strong>邀请类型：</strong>通用邀请链接</p>
          <p><strong>成员角色：</strong>{{ invitationInfo.role === 'admin' ? '管理员' : '成员' }}</p>
          <p><strong>说明：</strong>任何通过此链接访问的用户都可以以该角色加入组织</p>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showInviteLinkDialog = false">关闭</el-button>
        <el-button type="primary" @click="showInviteDialog = true">
          发送另一个邀请
        </el-button>
      </template>
    </el-dialog>

    <!-- 退出组织确认对话框 -->
    <el-dialog
      v-model="showLeaveDialog"
      title="确认退出组织"
      width="400px"
    >
      <div class="leave-dialog-content">
        <p>您确定要退出组织 <strong>{{ organization?.name }}</strong> 吗？</p>
        <p class="warning-text">退出后，您将失去对该组织及其所有项目的访问权限。</p>
      </div>
      
      <template #footer>
        <el-button @click="showLeaveDialog = false">取消</el-button>
        <el-button type="danger" @click="leaveOrganization" :loading="leavingOrg">
          确认退出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus, User, Document } from '@element-plus/icons-vue'
import { supabase } from '../lib/supabase'
import { 
  getOrganizationById, 
  getOrganizationMembers, 
  updateOrganization, 
  removeMember as removeOrganizationMember,
  createOrganizationInvitation,
  generateOrganizationInvitationLink,
  leaveOrganization as leaveOrganizationAPI
} from '../api/organizations'
import { 
  getOrganizationProjects, 
  createProject,
  updateProject
} from '../api/projects'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const activeTab = ref('projects')
const loading = ref(false)
const organization = ref<any>(null)
const projects = ref<any[]>([])
const members = ref<any[]>([])

// 对话框状态
const showCreateProjectDialog = ref(false)
const showInviteDialog = ref(false)
const showInviteLinkDialog = ref(false)
const showLeaveDialog = ref(false)
const creatingProject = ref(false)
const invitingMember = ref(false)
const leavingOrg = ref(false)

// 邀请链接数据
const invitationLink = ref('')
const invitationInfo = ref<any>(null)
const copyingLink = ref(false)

// 表单数据
const projectForm = reactive({
  name: '',
  description: '',
  status: '计划中' // 默认状态
})

const inviteForm = reactive({
  email: '',
  role: 'member'
})

const settingsForm = reactive({
  name: '',
  description: ''
})

// 表单引用
const projectFormRef = ref()

// 表单验证规则
const projectRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' }
  ]
}

// 计算属性
const isOrgAdmin = computed(() => {
  if (!authStore.user || !members.value.length) return false
  
  const currentUserMember = members.value.find(
    member => member.user_id === authStore.user?.id
  )
  
  return currentUserMember?.role === 'admin'
})

const isOrgCreator = computed(() => {
  return authStore.user && organization.value && organization.value.created_by === authStore.user.id
})

const canManageOrg = computed(() => {
  return isOrgCreator.value || isOrgAdmin.value
})

// 方法
const loadOrganization = async () => {
  try {
    const data = await getOrganizationById(route.params.id as string)
    organization.value = data
    settingsForm.name = data.name
    settingsForm.description = data.description || ''
  } catch (error: any) {
    ElMessage.error('加载组织信息失败: ' + error.message)
  }
}

const loadProjects = async () => {
  try {
    const data = await getOrganizationProjects(route.params.id as string)
    projects.value = data
  } catch (error: any) {
    ElMessage.error('加载项目列表失败: ' + error.message)
  }
}

const loadMembers = async () => {
  try {
    const data = await getOrganizationMembers(route.params.id as string)
    members.value = data
  } catch (error: any) {
    ElMessage.error('加载成员列表失败: ' + error.message)
  }
}

const handleCreateProject = async () => {
  if (!projectFormRef.value) return

  try {
    await projectFormRef.value.validate()
    creatingProject.value = true
    try {
        // 检查当前用户是否是组织创建者或管理员
        const { data: orgData } = await supabase
          .from('organizations')
          .select('created_by')
          .eq('id', route.params.id)
          .single()
        
        // 检查是否是组织创建者
        const isCreator = orgData?.created_by === authStore.user?.id
        
        // 检查是否是组织管理员
        let isAdmin = false
        if (!isCreator) {
          const { data: memberData } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', route.params.id)
            .eq('user_id', authStore.user?.id)
            .single()
          
          isAdmin = memberData?.role === 'admin'
        }
        
        if (!isCreator && !isAdmin) {
          throw new Error('只有组织创建者或管理员才能创建项目')
        }
        
        if (!authStore.user?.id) {
          throw new Error('用户未登录')
        }
        
        await createProject({
          name: projectForm.name,
          description: projectForm.description,
          status: projectForm.status,
          organization_id: route.params.id as string,
          created_by: authStore.user.id
        })

        ElMessage.success('项目创建成功')
        showCreateProjectDialog.value = false
        resetProjectForm()
        loadProjects()
      } catch (error: any) {
        ElMessage.error('创建项目失败: ' + error.message)
        console.error('创建项目错误详情:', error)
      } finally {
        creatingProject.value = false
      }
  } catch (e) {
    // 校验不通过，直接返回
    return
  }
}

const removeMember = async (memberId: string) => {
  try {
    await removeOrganizationMember(memberId)
    ElMessage.success('成员已移除')
    loadMembers()
  } catch (error: any) {
    ElMessage.error('移除成员失败: ' + error.message)
  }
}

const updateOrganizationSettings = async () => {
  try {
    const updateData = {
      name: settingsForm.name,
      description: settingsForm.description
    }
    console.log('更新数据:', updateData)
    console.log('settingsForm:', settingsForm)
    
    await updateOrganization(route.params.id as string, updateData)
    ElMessage.success('设置已保存')
    loadOrganization()
  } catch (error: any) {
    ElMessage.error('保存设置失败: ' + error.message)
  }
}

const copyInvitationLink = async () => {
  if (!invitationLink.value) {
    ElMessage.warning('没有可复制的邀请链接')
    return
  }

  copyingLink.value = true
  try {
    // 使用更健壮的复制方法
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(invitationLink.value)
      ElMessage.success('邀请链接已复制到剪贴板')
    } else {
      // 备用方法：使用textarea和execCommand
      const textArea = document.createElement('textarea')
      textArea.value = invitationLink.value
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        ElMessage.success('邀请链接已复制到剪贴板')
      } else {
        ElMessage.error('复制失败：浏览器不支持复制功能')
      }
    }
  } catch (error: any) {
    console.error('复制错误:', error)
    ElMessage.error('复制失败: ' + (error.message || '未知错误'))
  } finally {
    copyingLink.value = false
  }
}

const inviteMember = async () => {
  invitingMember.value = true
  try {
    // 创建组织邀请（不需要邮箱）
    console.log('正在创建组织邀请，参数:', {
      organizationId: route.params.id,
      role: inviteForm.role
    })
    
    const invitation = await createOrganizationInvitation(
      route.params.id as string,
      inviteForm.role,
      '', // inviterEmail (不再需要，API 会自动获取)
      '' // 空邮箱，表示通用邀请
    )
    
    console.log('邀请创建成功，返回数据:', invitation)
    
    // 生成邀请链接
    const orgId = route.params.id as string
    const token = invitation.invitationToken || invitation.token
    
    if (!token) {
      throw new Error('邀请创建成功但未返回有效的 token')
    }
    
    const origin = window.location.origin
    const link = `${origin}/accept-organization-invitation?token=${token}&organizationId=${orgId}`
    
    console.log('生成的邀请链接:', link)
    
    invitationLink.value = link
    invitationInfo.value = invitation
    showInviteLinkDialog.value = true
    showInviteDialog.value = false

    ElMessage.success('邀请链接已生成，请复制发送给被邀请人')
  } catch (error: any) {
    ElMessage.error('创建邀请失败: ' + error.message)
    console.error('邀请错误详情:', error)
  } finally {
    invitingMember.value = false
  }
}

const resetProjectForm = () => {
  projectForm.name = ''
  projectForm.description = ''
  projectForm.status = '计划中'
}

// 更新项目状态
const updateProjectStatus = async (projectId: string, newStatus: string) => {
  try {
    await updateProject(projectId, { status: newStatus })
    ElMessage.success('项目状态更新成功')
  } catch (error: any) {
    ElMessage.error('更新项目状态失败: ' + error.message)
    loadProjects()
  }
}

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '计划中': 'info',
    '进行中': 'warning',
    '已完成': 'success',
    '已暂停': 'danger'
  }
  return statusMap[status] || 'info'
}

// 退出组织
const leaveOrganization = async () => {
  if (!authStore.user || !organization.value) return
  
  leavingOrg.value = true
  try {
    // 调用API函数处理退出组织
    await leaveOrganizationAPI(organization.value.id)
    
    ElMessage.success('已成功退出组织')
    showLeaveDialog.value = false
    
    // 退出后跳转到组织列表页面
    router.push('/organizations')
  } catch (error: any) {
    console.error('退出组织失败:', error)
    ElMessage.error('退出组织失败: ' + (error.message || '未知错误'))
  } finally {
    leavingOrg.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 生命周期
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      loadOrganization(),
      loadProjects(),
      loadMembers()
    ])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.organization-detail {
  height: 100vh;
}

.header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  padding: 12px 20px 16px 20px;
  box-sizing: border-box;
  height: auto;
}

.back-section {
  margin-bottom: 12px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  padding: 2px 0;
  margin: 0;
  border: none;
  background: none;
  font-size: 14px;
}

.back-btn .el-icon {
  font-size: 14px;
}

.back-btn:hover {
  color: #409eff;
  background: none;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-row h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.org-description {
  margin: 0;
  color: #909399;
  font-size: 13px;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.org-info h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.org-info p {
  margin: 0;
  color: #909399;
}

.org-tabs {
  padding: 20px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.project-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.project-card:hover {
  transform: translateY(-2px);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.project-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.project-status-actions {
  flex-shrink: 0;
}

.status-select {
  width: 100px;
}

.project-desc {
  color: #606266;
  margin: 12px 0;
  line-height: 1.5;
}

.project-meta {
  color: #909399;
  font-size: 12px;
}

.members-section {
  padding: 20px 0;
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.members-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.settings-section {
  padding: 20px 0;
  max-width: 600px;
}

.loading {
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.danger-zone {
  margin-top: 40px;
  padding: 20px;
  border: 1px solid #f56c6c;
  border-radius: 8px;
  background-color: #fef0f0;
}

.danger-zone h3 {
  margin: 0 0 16px 0;
  color: #f56c6c;
  font-size: 16px;
}

.danger-actions p {
  margin: 0 0 16px 0;
  color: #606266;
  line-height: 1.5;
}

.no-permission-text {
  color: #909399;
  font-size: 12px;
}

.leave-dialog-content .warning-text {
  color: #f56c6c;
  font-weight: 500;
  margin-top: 8px;
}
</style>