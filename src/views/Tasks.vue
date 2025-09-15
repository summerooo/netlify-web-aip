<template>
  <div class="tasks-page">
    <div class="page-header">
      <div class="header-content">
        <h1>任务管理</h1>
        <p>管理您的所有任务</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateTaskDialog = true">
          <el-icon><Plus /></el-icon>
          创建任务
        </el-button>
      </div>
    </div>

    <div class="page-content">
      <!-- 任务统计 -->
      <div class="stats-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon total">
                  <el-icon><List /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ taskStats.total }}</div>
                  <div class="stat-label">总任务数</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon pending">
                  <el-icon><Clock /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ taskStats.pending }}</div>
                  <div class="stat-label">待办</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon inProgress">
                  <el-icon><Loading /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ taskStats.inProgress }}</div>
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
                  <div class="stat-number">{{ taskStats.completed }}</div>
                  <div class="stat-label">已完成</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon overdue">
                  <el-icon><Warning /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ taskStats.overdue }}</div>
                  <div class="stat-label">已过期</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon dueToday">
                  <el-icon><Bell /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ taskStats.dueToday }}</div>
                  <div class="stat-label">今日到期</div>
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
            placeholder="搜索任务标题或描述..."
            style="width: 300px;"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="filter-right">
          <el-select v-model="statusFilter" placeholder="任务状态" style="width: 120px;" clearable>
            <el-option label="待办" value="待办" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已取消" value="已取消" />
          </el-select>
          <el-select v-model="priorityFilter" placeholder="优先级" style="width: 120px; margin-left: 12px;" clearable>
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
          <el-select v-model="projectFilter" placeholder="所属项目" style="width: 150px; margin-left: 12px;" clearable>
            <el-option 
              v-for="project in userProjects" 
              :key="project.id"
              :label="project.name" 
              :value="project.id" 
            />
          </el-select>
          <el-select v-model="dueDateFilter" placeholder="截止时间" style="width: 120px; margin-left: 12px;" clearable>
            <el-option label="今天到期" value="today" />
            <el-option label="明天到期" value="tomorrow" />
            <el-option label="本周到期" value="thisWeek" />
            <el-option label="已过期" value="overdue" />
          </el-select>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="tasks-section">
        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="5" animated />
        </div>
        
        <div v-else-if="filteredTasks.length === 0" class="empty-state">
          <el-icon><DocumentCopy /></el-icon>
          <h3>{{ searchQuery || statusFilter || priorityFilter || projectFilter || dueDateFilter ? '未找到匹配的任务' : '暂无任务' }}</h3>
          <p>{{ searchQuery || statusFilter || priorityFilter || projectFilter || dueDateFilter ? '尝试调整筛选条件' : '创建您的第一个任务开始工作' }}</p>
          <el-button v-if="!searchQuery && !statusFilter && !priorityFilter && !projectFilter && !dueDateFilter" type="primary" @click="showCreateTaskDialog = true">
            创建任务
          </el-button>
        </div>

        <div v-else class="tasks-list">
          <el-card 
            v-for="task in filteredTasks" 
            :key="task.id" 
            class="task-card"
            @click="openTaskDetail(task)"
          >
            <div class="task-header">
              <div class="task-title">
                <h3>{{ task.title }}</h3>
                <div class="task-tags">
                  <el-tag :type="getStatusType(task.status)" size="small">
                    {{ task.status }}
                  </el-tag>
                  <el-tag :type="getPriorityType(task.priority)" size="small" style="margin-left: 8px;">
                    {{ task.priority }}优先级
                  </el-tag>
                </div>
              </div>
              <div class="task-actions">
                <el-dropdown trigger="click" @click.stop>
                  <el-button type="text" size="small">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="openTaskDetail(task)">
                        <el-icon><View /></el-icon>
                        查看详情
                      </el-dropdown-item>
                      <el-dropdown-item @click="editTask(task)">
                        <el-icon><Edit /></el-icon>
                        编辑任务
                      </el-dropdown-item>
                      <el-dropdown-item v-if="task.status !== '已完成'" @click="markAsCompleted(task)">
                        <el-icon><CircleCheck /></el-icon>
                        标记完成
                      </el-dropdown-item>
                      <el-dropdown-item @click="deleteTask(task)" divided>
                        <el-icon><Delete /></el-icon>
                        删除任务
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <div class="task-description">
              <p>{{ task.description || '暂无描述' }}</p>
            </div>

            <div class="task-meta">
              <div class="meta-item">
                <el-icon><Calendar /></el-icon>
                <span>创建于 {{ formatDate(task.created_at) }}</span>
              </div>
              <div v-if="task.due_date" class="meta-item">
                <el-icon><Clock /></el-icon>
                <span :class="{ 
                  'overdue': isOverdue(task.due_date),
                  'due-today': isDueToday(task.due_date),
                  'due-tomorrow': isDueTomorrow(task.due_date)
                }">
                  截止 {{ formatDate(task.due_date) }}
                  <el-tag v-if="getDueDateStatus(task.due_date)" 
                         :type="isOverdue(task.due_date) ? 'danger' : isDueToday(task.due_date) ? 'warning' : 'info'" 
                         size="small" 
                         style="margin-left: 8px;">
                    {{ getDueDateStatus(task.due_date) }}
                  </el-tag>
                </span>
              </div>
              <div class="meta-item">
                <el-icon><Folder /></el-icon>
                <span>{{ task.project_name || '无项目' }}</span>
              </div>
            </div>

            <div v-if="task.assignee_name" class="task-assignee">
              <el-avatar :size="24" :src="task.assignee_avatar">
                {{ task.assignee_name?.charAt(0) }}
              </el-avatar>
              <span>{{ task.assignee_name }}</span>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 创建/编辑任务对话框 -->
    <el-dialog
      v-model="showCreateTaskDialog"
      :title="editingTask ? '编辑任务' : '创建任务'"
      width="600px"
    >
      <el-form :model="taskForm" :rules="taskRules" ref="taskFormRef" label-width="80px">
        <el-form-item label="任务标题" prop="title">
          <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input 
            v-model="taskForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        <el-form-item label="所属项目" prop="project_id">
          <el-select v-model="taskForm.project_id" placeholder="请选择项目" style="width: 100%;" clearable>
            <el-option 
              v-for="project in userProjects" 
              :key="project.id"
              :label="project.name" 
              :value="project.id" 
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="taskForm.priority" placeholder="请选择优先级" style="width: 100%;">
                <el-option label="高" value="高" />
                <el-option label="中" value="中" />
                <el-option label="低" value="低" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务状态" prop="status">
              <el-select v-model="taskForm.status" placeholder="请选择状态" style="width: 100%;">
                <el-option label="待办" value="待办" />
                <el-option label="进行中" value="进行中" />
                <el-option label="已完成" value="已完成" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="截止日期" prop="due_date">
          <el-date-picker
            v-model="taskForm.due_date"
            type="datetime"
            placeholder="请选择截止日期"
            style="width: 100%;"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancelTaskEdit">取消</el-button>
        <el-button 
          type="primary" 
          :loading="saving"
          @click="handleSaveTask"
        >
          {{ saving ? '保存中...' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="showTaskDetailDialog"
      title="任务详情"
      width="700px"
    >
      <div v-if="selectedTask" class="task-detail">
        <div class="detail-header">
          <h2>{{ selectedTask.title }}</h2>
          <div class="detail-tags">
            <el-tag :type="getStatusType(selectedTask.status)">
              {{ selectedTask.status }}
            </el-tag>
            <el-tag :type="getPriorityType(selectedTask.priority)" style="margin-left: 8px;">
              {{ selectedTask.priority }}优先级
            </el-tag>
          </div>
        </div>

        <div class="detail-content">
          <div class="detail-section">
            <h4>任务描述</h4>
            <p>{{ selectedTask.description || '暂无描述' }}</p>
          </div>

          <div class="detail-section">
            <h4>任务信息</h4>
            <div class="detail-info">
              <div class="info-item">
                <span class="info-label">所属项目：</span>
                <span>{{ selectedTask.project_name || '无项目' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间：</span>
                <span>{{ formatDateTime(selectedTask.created_at) }}</span>
              </div>
              <div v-if="selectedTask.due_date" class="info-item">
                <span class="info-label">截止时间：</span>
                <span :class="{ 'overdue': isOverdue(selectedTask.due_date) }">
                  {{ formatDateTime(selectedTask.due_date) }}
                </span>
              </div>
              <div v-if="selectedTask.assignee_name" class="info-item">
                <span class="info-label">负责人：</span>
                <span>{{ selectedTask.assignee_name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showTaskDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="editTask(selectedTask)">
          编辑任务
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
  List,
  Clock,
  Loading,
  CircleCheck,
  DocumentCopy,
  MoreFilled,
  View,
  Edit,
  Delete,
  Calendar,
  Folder,
  Warning,
  Bell
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { getUserProjects } from '../api/projects'
import { getUserTasks, createTask, updateTask, deleteTask, markTaskAsCompleted } from '../api/tasks'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const saving = ref(false)
const showCreateTaskDialog = ref(false)
const showTaskDetailDialog = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const projectFilter = ref('')
const dueDateFilter = ref('')

const tasks = ref<any[]>([])
const userProjects = ref<any[]>([])
const taskFormRef = ref<any>(null)
const editingTask = ref<any>(null)
const selectedTask = ref<any>(null)

const taskForm = reactive({
  title: '',
  description: '',
  project_id: '',
  priority: '中',
  status: '待办',
  due_date: ''
})

const taskRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 1, max: 100, message: '任务标题长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择任务状态', trigger: 'change' }
  ]
}

// 任务统计
const taskStats = computed(() => {
  const total = tasks.value.length
  const pending = tasks.value.filter(t => t.status === '待办').length
  const inProgress = tasks.value.filter(t => t.status === '进行中').length
  const completed = tasks.value.filter(t => t.status === '已完成').length
  const overdue = tasks.value.filter(t => t.due_date && isOverdue(t.due_date) && t.status !== '已完成').length
  const dueToday = tasks.value.filter(t => t.due_date && isDueToday(t.due_date) && t.status !== '已完成').length

  return { total, pending, inProgress, completed, overdue, dueToday }
})

// 过滤后的任务列表
const filteredTasks = computed(() => {
  let filtered = tasks.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query))
    )
  }

  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(task => task.status === statusFilter.value)
  }

  // 优先级过滤
  if (priorityFilter.value) {
    filtered = filtered.filter(task => task.priority === priorityFilter.value)
  }

  // 项目过滤
  if (projectFilter.value) {
    filtered = filtered.filter(task => task.project_id === projectFilter.value)
  }

  // 截止时间过滤
  if (dueDateFilter.value) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    filtered = filtered.filter(task => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      
      switch (dueDateFilter.value) {
        case 'today':
          return dueDate >= today && dueDate < tomorrow
        case 'tomorrow':
          const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
          return dueDate >= tomorrow && dueDate < dayAfterTomorrow
        case 'thisWeek':
          return dueDate >= today && dueDate <= nextWeek
        case 'overdue':
          return dueDate < now && task.status !== '已完成'
        default:
          return true
      }
    })
  }

  // 按截止时间排序，过期和即将到期的任务优先显示
  return filtered.sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    
    const aOverdue = isOverdue(a.due_date)
    const bOverdue = isOverdue(b.due_date)
    
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1
    
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })
})

// 获取状态标签类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '待办': 'info',
    '进行中': 'warning',
    '已完成': 'success',
    '已取消': 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取优先级标签类型
const getPriorityType = (priority: string) => {
  const priorityMap: Record<string, string> = {
    '高': 'danger',
    '中': 'warning',
    '低': 'info'
  }
  return priorityMap[priority] || 'info'
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 检查是否过期
const isOverdue = (dueDate: string) => {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

// 检查是否今天到期
const isDueToday = (dueDate: string) => {
  if (!dueDate) return false
  const today = new Date()
  const due = new Date(dueDate)
  return today.toDateString() === due.toDateString()
}

// 检查是否明天到期
const isDueTomorrow = (dueDate: string) => {
  if (!dueDate) return false
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const due = new Date(dueDate)
  return tomorrow.toDateString() === due.toDateString()
}

// 获取截止时间状态文本
const getDueDateStatus = (dueDate: string) => {
  if (!dueDate) return ''
  
  if (isOverdue(dueDate)) return '已过期'
  if (isDueToday(dueDate)) return '今天到期'
  if (isDueTomorrow(dueDate)) return '明天到期'
  
  const now = new Date()
  const due = new Date(dueDate)
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 7) return `${diffDays}天后到期`
  return ''
}

// 打开任务详情
const openTaskDetail = (task: any) => {
  selectedTask.value = task
  showTaskDetailDialog.value = true
}

// 编辑任务
const editTask = (task: any) => {
  editingTask.value = task
  taskForm.title = task.title
  taskForm.description = task.description || ''
  taskForm.project_id = task.project_id || ''
  taskForm.priority = task.priority
  taskForm.status = task.status
  taskForm.due_date = task.due_date || ''
  
  showTaskDetailDialog.value = false
  showCreateTaskDialog.value = true
}

// 取消编辑
const cancelTaskEdit = () => {
  editingTask.value = null
  showCreateTaskDialog.value = false
  resetTaskForm()
}

// 重置表单
const resetTaskForm = () => {
  taskForm.title = ''
  taskForm.description = ''
  taskForm.project_id = ''
  taskForm.priority = '中'
  taskForm.status = '待办'
  taskForm.due_date = ''
}

// 保存任务
const handleSaveTask = async () => {
  if (!taskFormRef.value) return
  
  try {
    await taskFormRef.value.validate()
  } catch (error) {
    return
  }
  
  saving.value = true
  try {
    if (editingTask.value) {
      // 编辑任务
      await updateTask(editingTask.value.id, {
        title: taskForm.title,
        description: taskForm.description,
        project_id: taskForm.project_id || null,
        priority: taskForm.priority,
        status: taskForm.status,
        due_date: taskForm.due_date || null
      })
      ElMessage.success('任务更新成功')
    } else {
      // 创建新任务
      await createTask({
        title: taskForm.title,
        description: taskForm.description,
        project_id: taskForm.project_id || undefined,
        priority: taskForm.priority,
        status: taskForm.status,
        due_date: taskForm.due_date || undefined
      })
      ElMessage.success('任务创建成功')
    }
    
    showCreateTaskDialog.value = false
    editingTask.value = null
    resetTaskForm()
    
    // 重新加载任务列表
    await loadTasks()
    
  } catch (error: any) {
    ElMessage.error('保存任务失败: ' + error.message)
  } finally {
    saving.value = false
  }
}

// 标记为完成
const markAsCompleted = async (task: any) => {
  try {
    await markTaskAsCompleted(task.id)
    ElMessage.success('任务已标记为完成')
    // 重新加载任务列表
    await loadTasks()
  } catch (error: any) {
    ElMessage.error('操作失败: ' + error.message)
  }
}

// 删除任务
const deleteTaskItem = async (task: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务"${task.title}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await deleteTask(task.id)
    ElMessage.success('任务删除成功')
    // 重新加载任务列表
    await loadTasks()
  } catch (error: any) {
    if (error.message) {
      ElMessage.error('删除失败: ' + error.message)
    }
    // 用户取消删除时不显示错误
  }
}

// 加载用户任务
const loadTasks = async () => {
  loading.value = true
  try {
    const userTasks = await getUserTasks()
    tasks.value = userTasks || []
  } catch (error: any) {
    console.error('加载任务列表失败:', error)
    ElMessage.error('加载任务列表失败: ' + error.message)
    tasks.value = []
  } finally {
    loading.value = false
  }
}

// 加载用户项目
const loadUserProjects = async () => {
  try {
    const projects = await getUserProjects()
    userProjects.value = projects || []
  } catch (error: any) {
    console.error('加载项目列表失败:', error)
    userProjects.value = []
  }
}

onMounted(() => {
  loadTasks()
  loadUserProjects()
})
</script>

<style scoped>
.tasks-page {
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
  max-width: 1200px;
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

.stat-icon.pending {
  background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%);
}

.stat-icon.inProgress {
  background: linear-gradient(135deg, #e6a23c 0%, #f0a020 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
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

/* 任务列表 */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.task-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.task-title {
  flex: 1;
}

.task-title h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.task-tags {
  display: flex;
  align-items: center;
}

.task-description {
  margin-bottom: 16px;
}

.task-description p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.meta-item .overdue {
  color: #f56c6c;
  font-weight: 600;
}

.task-assignee {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

/* 任务详情 */
.task-detail {
  padding: 0;
}

.detail-header {
  margin-bottom: 24px;
}

.detail-header h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.detail-tags {
  display: flex;
  gap: 8px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.detail-section p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  font-size: 14px;
}

.info-label {
  font-weight: 600;
  color: #303133;
  min-width: 80px;
}

.info-item .overdue {
  color: #f56c6c;
  font-weight: 600;
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
  .tasks-page {
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
    flex-wrap: wrap;
  }
  
  .task-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>