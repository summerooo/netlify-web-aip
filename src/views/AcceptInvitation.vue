<template>
  <div class="accept-invitation-container">
    <div class="invitation-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>正在验证邀请...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <h2>邀请验证失败</h2>
        <p>{{ errorMessage }}</p>
        <button @click="goToDashboard" class="primary-button">返回首页</button>
      </div>
      
      <div v-else-if="success" class="success-state">
        <h2>邀请已接受</h2>
        <p>您已成功加入项目 <strong>{{ projectName }}</strong></p>
        <button @click="goToProject" class="primary-button">查看项目</button>
      </div>
      
      <div v-else class="invitation-details">
        <h2>项目邀请</h2>
        <p>您被邀请加入项目 <strong>{{ projectName }}</strong></p>
        <p>邀请人: {{ inviterEmail }}</p>
        <p>您的角色: {{ role }}</p>
        
        <div class="action-buttons">
          <button @click="acceptInvitation" class="primary-button" :disabled="processing">
            {{ processing ? '处理中...' : '接受邀请' }}
          </button>
          <button @click="goToDashboard" class="secondary-button" :disabled="processing">拒绝</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { acceptProjectInvitation, getInvitationDetails } from '../api/projects'

const route = useRoute()
const router = useRouter()

// 状态变量
const loading = ref(true)
const processing = ref(false)
const success = ref(false)
const error = ref(false)
const errorMessage = ref('')

// 邀请信息
const token = ref('')
const projectId = ref('')
const projectName = ref('加载中...')
const inviterEmail = ref('')
const role = ref('成员')

// 初始化
onMounted(async () => {
  // 从URL获取参数
  token.value = route.query.token as string
  projectId.value = route.query.projectId as string
  
  if (!token.value || !projectId.value) {
    error.value = true
    errorMessage.value = '无效的邀请链接，缺少必要参数'
    loading.value = false
    return
  }
  
  try {
    // 获取邀请详情
    const details = await getInvitationDetails(token.value)
    projectName.value = details.projectName
    inviterEmail.value = details.inviterEmail
    role.value = details.role || '成员'
    loading.value = false
  } catch (err) {
    console.error('获取邀请详情失败:', err)
    error.value = true
    errorMessage.value = '无法验证邀请信息，可能已过期或无效'
    loading.value = false
  }
})

// 接受邀请
const acceptInvitation = async () => {
  processing.value = true
  try {
    await acceptProjectInvitation(token.value, projectId.value)
    success.value = true
  } catch (err) {
    console.error('接受邀请失败:', err)
    error.value = true
    errorMessage.value = '接受邀请失败，请稍后再试'
  } finally {
    processing.value = false
  }
}

// 导航到项目页面
const goToProject = () => {
  router.push(`/projects/${projectId.value}`)
}

// 返回首页
const goToDashboard = () => {
  router.push('/dashboard')
}
</script>

<style scoped>
.accept-invitation-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.invitation-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 30px;
  width: 100%;
  max-width: 500px;
  text-align: center;
}

.loading-state, .error-state, .success-state, .invitation-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.primary-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.primary-button:hover {
  background-color: #2980b9;
}

.primary-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.secondary-button {
  background-color: #ecf0f1;
  color: #34495e;
  border: 1px solid #bdc3c7;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.secondary-button:hover {
  background-color: #bdc3c7;
}

.secondary-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

p {
  color: #7f8c8d;
  margin-bottom: 8px;
}
</style>