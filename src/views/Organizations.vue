<template>
  <div class="organizations">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h1>组织管理</h1>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            创建组织
          </el-button>
        </div>
      </el-header>

      <el-main class="main-content">
        <div v-if="loading" class="loading-container">
          <el-icon class="is-loading"><Loading /></el-icon>
        </div>

        <div v-else-if="organizations.length === 0" class="empty-state">
          <el-icon><OfficeBuilding /></el-icon>
          <h3>暂无组织</h3>
          <p>创建您的第一个组织来开始项目管理</p>
          <el-button type="primary" @click="showCreateDialog = true">
            创建组织
          </el-button>
        </div>

        <div v-else class="organizations-grid">
          <el-card 
            v-for="org in organizations" 
            :key="org.id"
            class="org-card"
            @click="$router.push(`/organizations/${org.id}`)"
          >
            <div class="org-header">
              <div class="org-avatar">
                <el-icon><OfficeBuilding /></el-icon>
              </div>
              <div class="org-info">
                <h3>{{ org.name }}</h3>
                <p>{{ org.description || '暂无描述' }}</p>
              </div>
              <div class="org-actions" v-if="isOrgAdmin(org)">
                <el-dropdown @command="(command) => handleOrgAction(command, org)" trigger="click">
                  <el-button 
                    type="text" 
                    size="small" 
                    @click.stop
                    class="action-btn"
                  >
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="delete" class="delete-item">
                        <el-icon><Delete /></el-icon>
                        删除组织
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            
            <div class="org-stats">
              <div class="stat-item">
                <span class="stat-number">{{ org.project_count || 0 }}</span>
                <span class="stat-label">项目</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ org.member_count || 0 }}</span>
                <span class="stat-label">成员</span>
              </div>
            </div>

            <div class="org-footer">
              <el-tag size="small" type="info">
                创建于 {{ formatDate(org.created_at) }}
              </el-tag>
            </div>
          </el-card>
        </div>
      </el-main>
    </el-container>

    <!-- 创建组织对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建组织"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="组织名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="请输入组织名称"
          />
        </el-form-item>
        
        <el-form-item label="组织描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入组织描述（可选）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="creating"
          @click="handleCreate"
        >
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 删除组织确认对话框 -->
    <el-dialog
      v-model="showDeleteDialog"
      title="删除组织"
      width="400px"
      @close="organizationToDelete = null"
    >
      <div class="delete-dialog-content">
        <el-icon class="warning-icon"><WarningFilled /></el-icon>
        <div class="delete-message">
          <h4>确认删除组织？</h4>
          <p>您即将删除组织 <strong>{{ organizationToDelete?.name }}</strong></p>
          <p class="warning-text">此操作将永久删除该组织及其所有相关数据，包括项目、任务等，且无法恢复。</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button 
          type="danger" 
          :loading="deleting"
          @click="handleDelete"
        >
          确认删除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { Plus, OfficeBuilding, MoreFilled, Delete, WarningFilled, Loading } from '@element-plus/icons-vue'
import { getUserOrganizations, createOrganization, deleteOrganization } from '../api/organizations'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const loading = ref(false)
const creating = ref(false)
const deleting = ref(false)
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const organizations = ref([])
const createFormRef = ref<FormInstance>()
const organizationToDelete = ref<any>(null)

const createForm = reactive({
  name: '',
  description: ''
})

const rules = {
  name: [
    { required: true, message: '请输入组织名称', trigger: 'blur' },
    { min: 2, max: 50, message: '组织名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const isOrgAdmin = (org: any) => {
  return org.userRole === 'admin'
}

const loadOrganizations = async () => {
  loading.value = true
  try {
    const data = await getUserOrganizations()
    organizations.value = data
  } catch (error: any) {
    ElMessage.error('加载组织列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  if (!createFormRef.value) return

  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      creating.value = true
      try {
        await createOrganization(
          createForm.name,
          createForm.description
        )

        ElMessage.success('组织创建成功')
        showCreateDialog.value = false
        resetForm()
        loadOrganizations()
      } catch (error: any) {
        ElMessage.error('创建组织失败: ' + error.message)
      } finally {
        creating.value = false
      }
    }
  })
}

const resetForm = () => {
  createForm.name = ''
  createForm.description = ''
  createFormRef.value?.resetFields()
}

const handleOrgAction = (command: string, org: any) => {
  if (command === 'delete') {
    organizationToDelete.value = org
    showDeleteDialog.value = true
  }
}

const handleDelete = async () => {
  if (!organizationToDelete.value) return

  deleting.value = true
  try {
    await deleteOrganization(organizationToDelete.value.id)
    ElMessage.success('组织删除成功')
    showDeleteDialog.value = false
    organizationToDelete.value = null
    loadOrganizations()
  } catch (error: any) {
    ElMessage.error('删除组织失败: ' + error.message)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadOrganizations()
})
</script>

<style scoped>
.organizations {
  height: 100vh;
  background: #f5f7fa;
}

.header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-radius: 12px;

}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.main-content {
  padding: 20px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

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

.organizations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.org-card {
  cursor: pointer;
  transition: all 0.2s;
  height: fit-content;
}

.org-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.org-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  position: relative;
}

.org-actions {
  position: absolute;
  top: 0;
  right: 0;
}

.action-btn {
  padding: 4px;
  color: #909399;
  transition: color 0.2s;
}

.action-btn:hover {
  color: #409eff;
}

.org-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.org-info {
  flex: 1;
  min-width: 0;
}

.org-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  word-break: break-word;
}

.org-info p {
  margin: 0;
  font-size: 14px;
  color: #909399;
  line-height: 1.4;
  word-break: break-word;
}

.org-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-number {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.org-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delete-dialog-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 0;
}

.warning-icon {
  font-size: 48px;
  color: #f56c6c;
  flex-shrink: 0;
}

.delete-message h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.delete-message p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.warning-text {
  color: #f56c6c !important;
  font-weight: 500;
}

.delete-item {
  color: #f56c6c;
}

.delete-item:hover {
  background-color: #fef0f0;
}

@media (max-width: 768px) {
  .organizations-grid {
    grid-template-columns: 1fr;
  }
  
  .main-content {
    padding: 16px;
  }
}
</style>