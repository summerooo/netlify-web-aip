<template>
  <div class="knowledge">
    <div class="knowledge-header">
      <div class="header-left">
        <h2>知识库</h2>
        <p>管理和组织您的知识资源</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          添加知识
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="knowledge-filters">
      <el-input
        v-model="searchQuery"
        placeholder="搜索知识库..."
        @input="handleSearch"
        clearable
        style="width: 300px;"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-select v-model="selectedType" placeholder="类型筛选" @change="handleTypeFilter" clearable>
        <el-option label="全部" value="" />
        <el-option label="文档" value="document" />
        <el-option label="链接" value="link" />
        <el-option label="笔记" value="note" />
      </el-select>

      <el-select v-model="selectedProject" placeholder="项目筛选" @change="handleProjectFilter" clearable>
        <el-option label="全部项目" value="" />
        <el-option 
          v-for="project in userProjects" 
          :key="project.id" 
          :label="project.name" 
          :value="project.id" 
        />
      </el-select>
    </div>

    <!-- 知识库列表 -->
    <div class="knowledge-content">
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="filteredKnowledgeItems.length === 0" class="empty-state">
        <el-icon><Document /></el-icon>
        <h3>暂无知识库内容</h3>
        <p>开始创建您的第一个知识项目</p>
        <el-button type="primary" @click="showCreateDialog = true">
          添加知识
        </el-button>
      </div>

      <div v-else class="knowledge-grid">
        <el-card 
          v-for="item in filteredKnowledgeItems" 
          :key="item.id"
          class="knowledge-card"
          @click="viewItem(item)"
        >
          <div class="card-header">
            <div class="card-icon">
              <el-icon v-if="item.type === 'document'"><Document /></el-icon>
              <el-icon v-else-if="item.type === 'link'"><Link /></el-icon>
              <el-icon v-else><EditPen /></el-icon>
            </div>
            <div class="card-actions">
              <el-dropdown @command="handleAction">
                <el-button type="text" size="small">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{action: 'edit', item}">编辑</el-dropdown-item>
                    <el-dropdown-item :command="{action: 'delete', item}" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div class="card-content">
            <h3 class="card-title">{{ item.title }}</h3>
            <p class="card-description">{{ item.description || '暂无描述' }}</p>
            

          </div>

          <div class="card-footer">
            <div class="card-meta">
              <el-tag :type="getTypeColor(item.type)" size="small">
                {{ getTypeLabel(item.type) }}
              </el-tag>
              <span class="created-by">{{ item.created_by_name }}</span>
              <span class="created-at">{{ formatDate(item.created_at) }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingItem ? '编辑知识' : '添加知识'"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="选择类型">
            <el-option label="文档" value="document" />
            <el-option label="链接" value="link" />
            <el-option label="笔记" value="note" />
          </el-select>
        </el-form-item>

        <el-form-item label="项目" prop="project_id">
          <el-select v-model="form.project_id" placeholder="选择项目">
            <el-option 
              v-for="project in userProjects" 
              :key="project.id" 
              :label="project.name" 
              :value="project.id" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="链接" prop="url" v-if="form.type === 'link'">
          <el-input v-model="form.url" placeholder="请输入链接地址" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入描述" 
          />
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input 
            v-model="form.content" 
            type="textarea" 
            :rows="5"
            placeholder="请输入内容" 
          />
        </el-form-item>


      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ editingItem ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="selectedItem?.title"
      width="800px"
    >
      <div v-if="selectedItem" class="item-detail">
        <div class="detail-header">
          <el-tag :type="getTypeColor(selectedItem.type)">
            {{ getTypeLabel(selectedItem.type) }}
          </el-tag>
          <div class="detail-meta">
            <span>创建者：{{ selectedItem.created_by_name }}</span>
            <span>创建时间：{{ formatDate(selectedItem.created_at) }}</span>
          </div>
        </div>

        <div class="detail-content">
          <p v-if="selectedItem.description" class="description">
            {{ selectedItem.description }}
          </p>
          
          <div v-if="selectedItem.url" class="url-section">
            <strong>链接：</strong>
            <el-link :href="selectedItem.url" target="_blank" type="primary">
              {{ selectedItem.url }}
            </el-link>
          </div>

          <div v-if="selectedItem.content" class="content-section">
            <strong>内容：</strong>
            <div class="content-text">{{ selectedItem.content }}</div>
          </div>


        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Document,
  Link,
  EditPen,
  MoreFilled
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { 
  getProjectKnowledge,
  createKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  searchKnowledgeItems,
  type KnowledgeItem
} from '../api/knowledge'
import { getUserProjects } from '../api/projects'
import { supabase } from '../lib/supabase'

const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const knowledgeItems = ref<KnowledgeItem[]>([])
const userProjects = ref<any[]>([])
const searchQuery = ref('')
const selectedType = ref('')
const selectedProject = ref('')
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const editingItem = ref<KnowledgeItem | null>(null)
const selectedItem = ref<KnowledgeItem | null>(null)

// 表单数据
const form = ref({
  title: '',
  description: '',
  content: '',
  type: 'document' as 'document' | 'link' | 'note',
  url: '',
  project_id: ''
})

const formRef = ref()

// 表单验证规则
const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  project_id: [{ required: true, message: '请选择项目', trigger: 'change' }],
  url: [
    { 
      validator: (rule: any, value: any, callback: any) => {
        if (form.value.type === 'link' && !value) {
          callback(new Error('请输入链接地址'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

// 计算属性
const filteredKnowledgeItems = computed(() => {
  let items = knowledgeItems.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.content?.toLowerCase().includes(query)
    )
  }

  if (selectedType.value) {
    items = items.filter(item => item.type === selectedType.value)
  }

  if (selectedProject.value) {
    items = items.filter(item => item.project_id === selectedProject.value)
  }

  return items
})

// 方法
const loadUserProjects = async () => {
  try {
    if (!authStore.user?.id) return
    const projects = await getUserProjects()
    userProjects.value = projects
  } catch (error) {
    console.error('加载用户项目失败:', error)
  }
}

const loadKnowledgeItems = async () => {
  loading.value = true
  try {
    if (!authStore.user?.id) return
    
    // 获取用户所有项目的知识库
    const allItems: KnowledgeItem[] = []
    
    // 首先获取用户参与的所有项目
    const { data: projectMemberships, error: memberError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', authStore.user.id)

    if (memberError) {
      console.error('获取项目成员关系失败:', memberError)
      ElMessage.error('加载项目信息失败')
      return
    }

    if (projectMemberships && projectMemberships.length > 0) {
      const projectIds = projectMemberships.map(m => m.project_id)
      
      // 直接从数据库获取所有相关的知识库项目
      const { data: knowledgeData, error: knowledgeError } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          user_profiles:created_by (full_name)
        `)
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })

      if (knowledgeError) {
        console.error('获取知识库数据失败:', knowledgeError)
        ElMessage.error('加载知识库失败')
        return
      }

      // 处理数据
      const processedData = (knowledgeData || []).map(item => ({
        ...item,
        created_by_name: item.user_profiles?.full_name || '未知用户',
        tags: Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : [])
      }))

      allItems.push(...processedData)
    }
    
    knowledgeItems.value = allItems
    console.log('加载的知识库项目数量:', allItems.length)
  } catch (error) {
    console.error('加载知识库失败:', error)
    ElMessage.error('加载知识库失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  // 搜索逻辑在计算属性中处理
}

const handleTypeFilter = () => {
  // 筛选逻辑在计算属性中处理
}

const handleProjectFilter = () => {
  // 筛选逻辑在计算属性中处理
}

const viewItem = (item: KnowledgeItem) => {
  selectedItem.value = item
  showDetailDialog.value = true
}

const handleAction = ({ action, item }: { action: string, item: KnowledgeItem }) => {
  if (action === 'edit') {
    editItem(item)
  } else if (action === 'delete') {
    confirmDelete(item)
  }
}

const editItem = (item: KnowledgeItem) => {
  editingItem.value = item
  form.value = {
    title: item.title,
    description: item.description || '',
    content: item.content || '',
    type: item.type,
    url: item.url || '',
    project_id: item.project_id
  }
  showCreateDialog.value = true
}

const confirmDelete = async (item: KnowledgeItem) => {
  try {
    await ElMessageBox.confirm('确定要删除这个知识项目吗？', '确认删除', {
      type: 'warning'
    })
    await deleteKnowledgeItem(item.id)
    ElMessage.success('删除成功')
    await loadKnowledgeItems()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true

    if (editingItem.value) {
      await updateKnowledgeItem(editingItem.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await createKnowledgeItem(form.value)
      ElMessage.success('创建成功')
    }

    showCreateDialog.value = false
    await loadKnowledgeItems()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  editingItem.value = null
  form.value = {
    title: '',
    description: '',
    content: '',
    type: 'document',
    url: '',
    project_id: ''
  }
  formRef.value?.resetFields()
}

const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    document: 'primary',
    link: 'success',
    note: 'warning'
  }
  return colorMap[type] || 'info'
}

const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    document: '文档',
    link: '链接',
    note: '笔记'
  }
  return labelMap[type] || type
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 生命周期
onMounted(async () => {
  await loadUserProjects()
  await loadKnowledgeItems()
})
</script>

<style scoped>
.knowledge {
  height: 100%;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.knowledge-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.knowledge-header p {
  color: #909399;
  margin: 0;
}

.knowledge-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
}

.knowledge-content {
  min-height: 400px;
}

.loading-state {
  padding: 40px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #909399;
}

.empty-state .el-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.empty-state h3 {
  font-size: 18px;
  margin: 16px 0 8px 0;
  color: #606266;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.knowledge-card {
  cursor: pointer;
  transition: all 0.2s;
  height: fit-content;
}

.knowledge-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-icon {
  color: #409eff;
  font-size: 20px;
}

.card-content {
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.card-description {
  font-size: 14px;
  color: #909399;
  margin: 0 0 12px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.created-by {
  margin-left: auto;
}

.item-detail .detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #909399;
}

.detail-content {
  line-height: 1.6;
}

.detail-content > div {
  margin-bottom: 16px;
}

.description {
  font-size: 16px;
  color: #606266;
  margin-bottom: 16px;
}

.content-text {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  white-space: pre-wrap;
  margin-top: 8px;
}

.url-section .el-link {
  margin-left: 8px;
}

@media (max-width: 768px) {
  .knowledge-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .knowledge-grid {
    grid-template-columns: 1fr;
  }
  
  .knowledge-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>