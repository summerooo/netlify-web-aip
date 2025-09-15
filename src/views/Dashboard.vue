<template>
  <div class="dashboard">
    <div class="dashboard-content">
      <div class="welcome-section">
        <h2>欢迎回来！</h2>
        <p>今天是 {{ currentDate }}，让我们开始高效的工作吧</p>
      </div>

      <div class="stats-grid">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon color="#409eff"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.organizations }}</div>
              <div class="stat-label">组织数量</div>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon color="#67c23a"><Folder /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.projects }}</div>
              <div class="stat-label">项目数量</div>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon color="#e6a23c"><List /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.tasks }}</div>
              <div class="stat-label">待办任务</div>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon color="#f56c6c"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.documents }}</div>
              <div class="stat-label">知识文档</div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="content-grid">
        <el-card class="recent-projects">
          <template #header>
            <div class="card-header">
              <span>最近项目</span>
              <el-button type="primary" size="small" @click="$router.push('/organizations')">
                查看全部
              </el-button>
            </div>
          </template>
          <div v-if="recentProjects.length === 0" class="empty-state">
            <el-icon><Folder /></el-icon>
            <p>暂无项目</p>
            <el-button type="primary" @click="$router.push('/organizations')">
              创建项目
            </el-button>
          </div>
          <div v-else class="project-list">
            <div 
              v-for="project in recentProjects" 
              :key="project.id"
              class="project-item"
              @click="selectProject(project)"
            >
              <div class="project-info">
                <h4>{{ project.name }}</h4>
                <p>{{ project.description }}</p>
              </div>
              <div class="project-status">
                <el-tag :type="getStatusType(project.status)">
                  {{ project.status }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="ai-assistant">
          <template #header>
            <div class="card-header">
              <span>AI 助手</span>
            </div>
          </template>
          <div class="ai-content">
            <div class="ai-avatar">
              <el-icon><Setting /></el-icon>
            </div>
            <div class="ai-message">
              <p>您好！我是您的AI项目管理助手。有什么可以帮助您的吗？</p>
            </div>
          </div>
          <el-button type="primary" style="width: 100%; margin-top: 16px;">
            开始对话
          </el-button>
        </el-card>

        <!-- 项目详情面板 -->
        <el-card v-if="selectedProject" class="project-detail-panel">
          <template #header>
            <div class="card-header">
              <span>项目详情</span>
              <el-button type="text" @click="selectedProject = null">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </template>
          <div class="project-detail-content">
            <h3>{{ selectedProject.name }}</h3>
            <p class="project-description">{{ selectedProject.description }}</p>
            <div class="project-meta">
              <el-tag :type="getStatusType(selectedProject.status)">
                {{ selectedProject.status }}
              </el-tag>
              <span class="project-date">创建时间: {{ selectedProject.created_at }}</span>
            </div>
            <el-button 
              type="primary" 
              @click="$router.push(`/projects/${selectedProject.id}`)"
              style="margin-top: 16px;"
            >
              查看完整详情
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  OfficeBuilding, 
  Folder, 
  List, 
  Document,
  Setting,
  Close
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { getUserStats, getRecentProjects, getRecentActivities } from '../api/dashboard'

const router = useRouter()
const authStore = useAuthStore()

const stats = ref({
  organizations: 0,
  projects: 0,
  tasks: 0,
  documents: 0
})

const recentProjects = ref([])
const recentActivities = ref([])
const selectedProject = ref(null)

const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '进行中': 'success',
    '已完成': 'info',
    '已暂停': 'warning',
    '已取消': 'danger'
  }
  return statusMap[status] || 'info'
}

const selectProject = (project: any) => {
  selectedProject.value = project
}

const loadDashboardData = async () => {
  if (!authStore.user?.id) return
  
  try {
    // 加载统计数据
    const statsData = await getUserStats(authStore.user.id)
    stats.value = statsData
    
    // 加载最近项目
    const projectsData = await getRecentProjects(authStore.user.id)
    recentProjects.value = projectsData
    
    // 加载最近活动
    const activitiesData = await getRecentActivities(authStore.user.id)
    recentActivities.value = activitiesData
  } catch (error: any) {
    console.error('加载仪表盘数据失败:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard {
  height: 100%;
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.welcome-section {
  margin-bottom: 24px;
}

.welcome-section h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.welcome-section p {
  color: #909399;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
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
  border-radius: 8px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.project-item:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.project-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.project-info p {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.ai-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.ai-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.ai-message {
  flex: 1;
  background: #f5f7fa;
  padding: 12px 16px;
  border-radius: 12px;
  border-top-left-radius: 4px;
}

.ai-message p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>