<template>
  <div class="projects-page">
    <div class="page-header">
      <div class="header-content">
        <h1>项目管理</h1>
        <p>管理您参与的所有项目</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateProjectDialog = true">
          <el-icon><Plus /></el-icon>
          创建项目
        </el-button>
      </div>
    </div>

    <div class="page-content">
      <!-- 项目统计 -->
      <div class="stats-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon total">
                  <el-icon><Folder /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ projectStats.total }}</div>
                  <div class="stat-label">总项目数</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon active">
                  <el-icon><Loading /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ projectStats.active }}</div>
                  <div class="stat-label">进行中</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon completed">
                  <el-icon><CircleCheck /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ projectStats.completed }}</div>
                  <div class="stat-label">已完成</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon managed">
                  <el-icon><User /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ projectStats.managed }}</div>
                  <div class="stat-label">我管理的</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 筛选和搜索 -->
      <div class="filter-section">
        <div class="filter-left">
          <el-input
            v-model="searchQuery"
            placeholder="搜索项目名称或描述..."
            style="width: 300px;"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="filter-right">
          <el-select v-model="statusFilter" placeholder="项目状态" style="width: 120px;" clearable>
            <el-option label="进行中" value="进行中" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已暂停" value="已暂停" />
            <el-option label="计划中" value="计划中" />
          </el-select>
          <el-select v-model="roleFilter" placeholder="我的角色" style="width: 120px; margin-left: 12px;" clearable>
            <el-option label="创建者" value="creator" />
            <el-option label="管理员" value="manager" />
            <el-option label="成员" value="member" />
          </el-select>
        </div>
      </div>

      <!-- 项目列表 -->
      <div class="projects-section">
        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="3" animated />
        </div>
        
        <div v-else-if="filteredProjects.length === 0" class="empty-state">
          <el-icon><FolderOpened /></el-icon>
          <h3>{{ searchQuery || statusFilter || roleFilter ? '未找到匹配的项目' : '暂无项目' }}</h3>
          <p>{{ searchQuery || statusFilter || roleFilter ? '尝试调整筛选条件' : '创建您的第一个项目开始协作' }}</p>
          <el-button v-if="!searchQuery && !statusFilter && !roleFilter" type="primary" @click="showCreateProjectDialog = true">
            创建项目
          </el-button>
        </div>

        <div v-else class="projects-grid">
          <el-card 
            v-for="project in filteredProjects" 
            :key="project.id" 
            class="project-card"
            @click="goToProject(project.id)"
          >
            <div class="project-header">
              <div class="project-title">
                <h3>{{ project.name }}</h3>
                <el-tag :type="getStatusType(project.status)" size="small">
                  {{ project.status }}
                </el-tag>
              </div>
              <div class="project-actions"  @click.stop>
                <el-dropdown trigger="click">
                  <el-button type="text" size="small">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="goToProject(project.id)">
                        <el-icon><View /></el-icon>
                        查看详情
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <div class="project-description">
              <p>{{ project.description || '暂无描述' }}</p>
            </div>

            <div class="project-meta">
              <div class="meta-item">
                <el-icon><Calendar /></el-icon>
                <span>{{ formatDate(project.created_at) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><OfficeBuilding /></el-icon>
                <span>{{ project.organization_name || '未知组织' }}</span>
              </div>
            </div>

            <div class="project-stats">
              <div class="stat-item">
                <span class="stat-number">{{ project.task_count || 0 }}</span>
                <span class="stat-label">任务</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ project.member_count || 0 }}</span>
                <span class="stat-label">成员</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ project.completion_rate || 0 }}%</span>
                <span class="stat-label">完成率</span>
              </div>
            </div>

            <div class="project-footer">
              <div class="project-role">
                <el-tag size="small" :type="getRoleType(project.user_role)">
                  {{ getRoleName(project.user_role) }}
                </el-tag>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 创建项目对话框 -->
    <el-dialog
      v-model="showCreateProjectDialog"
      title="创建项目"
      width="500px"
    >
      <el-form :model="projectForm" :rules="projectRules" ref="projectFormRef" label-width="80px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input 
            v-model="projectForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入项目描述"
          />
        </el-form-item>
        <el-form-item label="所属组织" prop="organization_id">
          <el-select v-model="projectForm.organization_id" placeholder="请选择组织" style="width: 100%;">
            <el-option 
              v-for="org in userOrganizations" 
              :key="org.id"
              :label="org.name" 
              :value="org.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="项目状态" prop="status">
          <el-select v-model="projectForm.status" placeholder="请选择状态" style="width: 100%;">
            <el-option label="计划中" value="计划中" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已暂停" value="已暂停" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateProjectDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="creating"
          @click="handleCreateProject"
        >
          {{ creating ? '创建中...' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  Search, 
  Folder,
  Loading,
  CircleCheck,
  User,
  FolderOpened,
  MoreFilled,
  View,
  Edit,
  Delete,
  Calendar,
  OfficeBuilding
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { getUserProjects } from '../api/projects'
import { getUserOrganizations } from '../api/organizations'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const creating = ref(false)
const showCreateProjectDialog = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const roleFilter = ref('')

const projects = ref<Array<{ user_role: string; name: string; [key: string]: any }>>([])
const userOrganizations = ref<Array<{ id: string; name: string }>>([])
const projectFormRef = ref(null)

const projectForm = reactive({
  name: '',
  description: '',
  organization_id: '',
  status: '计划中'
})

const projectRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 1, max: 50, message: '项目名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  organization_id: [
    { required: true, message: '请选择所属组织', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择项目状态', trigger: 'change' }
  ]
}

// 项目统计
const projectStats = computed(() => {
  const total = projects.value.length
  const active = projects.value.filter(p => p.status === '进行中').length
  const completed = projects.value.filter(p => p.status === '已完成').length
  const managed = projects.value.filter(p => p.user_role === 'creator' || p.user_role === 'manager').length

  return { total, active, completed, managed }
})

// 过滤后的项目列表
const filteredProjects = computed(() => {
  let filtered = projects.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(project => 
      project.name.toLowerCase().includes(query) ||
      (project.description && project.description.toLowerCase().includes(query))
    )
  }

  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(project => project.status === statusFilter.value)
  }

  // 角色过滤
  if (roleFilter.value) {
    if (roleFilter.value === 'creator') {
      filtered = filtered.filter(project => project.user_role === 'creator')
    } else {
      filtered = filtered.filter(project => project.user_role === roleFilter.value)
    }
  }

  return filtered
})

// 获取状态标签类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '进行中': 'success',
    '已完成': 'info',
    '已暂停': 'warning',
    '计划中': '',
    '已取消': 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取角色标签类型
const getRoleType = (role: string) => {
  const roleMap: Record<string, string> = {
    'creator': 'danger',
    'manager': 'warning',
    'member': 'info'
  }
  return roleMap[role] || 'info'
}

// 获取角色名称
const getRoleName = (role: string) => {
  const roleMap: Record<string, string> = {
    'creator': '创建者',
    'manager': '管理员',
    'member': '成员'
  }
  return roleMap[role] || role
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 跳转到项目详情
const goToProject = (projectId: string) => {
  router.push(`/projects/${projectId}`)
}

// 加载用户项目
const loadProjects = async () => {
  loading.value = true
  try {
    const userProjects = await getUserProjects()
    projects.value = userProjects || []
  } catch (error: any) {
    console.error('加载项目列表失败:', error)
    ElMessage.error('加载项目列表失败: ' + error.message)
    projects.value = []
  } finally {
    loading.value = false
  }
}

// 加载用户组织
const loadUserOrganizations = async () => {
  try {
    const organizations = await getUserOrganizations()
    userOrganizations.value = organizations || []
  } catch (error: any) {
    console.error('加载组织列表失败:', error)
    ElMessage.error('加载组织列表失败: ' + error.message)
    userOrganizations.value = []
  }
}

// 创建项目
const handleCreateProject = async () => {
  if (!projectFormRef.value) return
  
  try {
    await projectFormRef.value.validate()
  } catch (error) {
    return
  }
  
  creating.value = true
  try {
    // 模拟创建项目
    const newProject = {
      id: Date.now().toString(),
      name: projectForm.name,
      description: projectForm.description,
      status: projectForm.status,
      organization_name: (userOrganizations.value.find(org => org.id === projectForm.organization_id) as { name?: string })?.name || '未知组织',
      user_role: 'creator',
      task_count: 0,
      member_count: 1,
      completion_rate: 0,
      created_at: new Date().toISOString()
    }
    
    projects.value.unshift(newProject as any)
    
    ElMessage.success('项目创建成功')
    showCreateProjectDialog.value = false
    
    // 重置表单
    projectForm.name = ''
    projectForm.description = ''
    projectForm.organization_id = ''
    projectForm.status = '计划中'
    
  } catch (error: any) {
    ElMessage.error('创建项目失败: ' + error.message)
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  loadProjects()
  loadUserOrganizations()
})
</script>

<style scoped>
.projects-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 20px;
  border-radius: 12px;

}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.header-content p {
  margin: 0;
  font-size: 16px;
  color: #909399;
}

.page-content {
  /* max-width: 1200px; */
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
}

.stat-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.stat-icon.active {
  background: linear-gradient(135deg, #e6a23c 0%, #f0a020 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.stat-icon.managed {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

/* 筛选区域 */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.filter-right {
  display: flex;
  align-items: center;
}

/* 项目网格 */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.project-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  overflow: hidden;
}

.project-card:hover {
  border-color: #409eff;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
  transform: translateY(-4px);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.project-title {
  flex: 1;
}

.project-title h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.project-description {
  margin-bottom: 16px;
}

.project-description p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.project-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  margin-bottom: 16px;
  border-top: 1px solid #f0f2f5;
  border-bottom: 1px solid #f0f2f5;
}

.stat-item {
  text-align: center;
}

.stat-item .stat-number {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
  line-height: 1;
}

.stat-item .stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.project-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #909399;
}

.empty-state .el-icon {
  font-size: 64px;
  margin-bottom: 20px;
  color: #c0c4cc;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #606266;
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 14px;
}

/* 加载状态 */
.loading-state {
  padding: 20px;
}

/* 响应式 */
@media (max-width: 768px) {
  .projects-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-right {
    justify-content: flex-start;
    gap: 12px;
  }
  
  .projects-grid {
    grid-template-columns: 1fr;
  }
  
  .project-stats {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>