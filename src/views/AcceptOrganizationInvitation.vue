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
        <p>您已成功加入组织 <strong>{{ organizationName }}</strong></p>
        <button @click="goToOrganization" class="primary-button">查看组织</button>
      </div>
      
      <div v-else class="invitation-details">
        <h2>组织邀请</h2>
        <p>您被邀请加入组织 <strong>{{ organizationName }}</strong></p>
        <p>邀请人: {{ inviterEmail }}</p>
        <p>您的角色: {{ getRoleName(role) }}</p>
        
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
import { acceptOrganizationInvitation, getOrganizationInvitationDetails } from '../api/organizations'

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
const organizationId = ref('')
const organizationName = ref('加载中...')
const inviterEmail = ref('')
const role = ref('member')

// 初始化
onMounted(async () => {
  // 调试信息
  console.log('当前 URL:', window.location.href)
  console.log('route.query:', route.query)
  console.log('route.fullPath:', route.fullPath)
  
  // 从URL获取参数
  token.value = route.query.token as string
  organizationId.value = route.query.organizationId as string
  
  // 兜底：如果当前 query 为空，尝试从 localStorage 恢复
  if (!token.value || !organizationId.value) {
    const savedInvitation = localStorage.getItem('org_invitation_params')
    if (savedInvitation) {
      try {
        const params = JSON.parse(savedInvitation)
        if (!token.value && params.token) token.value = params.token
        if (!organizationId.value && params.organizationId) organizationId.value = params.organizationId
        console.log('从 localStorage 恢复参数:', params)
      } catch (e) {
        console.error('解析 localStorage 参数失败:', e)
      }
    }
  } else {
    // 保存参数到 localStorage，防止登录过程中丢失
    localStorage.setItem('org_invitation_params', JSON.stringify({
      token: token.value,
      organizationId: organizationId.value
    }))
  }
  
  if (!token.value || !organizationId.value) {
    error.value = true
    errorMessage.value = `无效的邀请链接，缺少必要参数。当前参数: token=${token.value || '空'}, organizationId=${organizationId.value || '空'}`
    loading.value = false
    return
  }
  
  try {
    // 获取邀请详情
    console.log('正在查询邀请详情，token:', token.value)
    const details = await getOrganizationInvitationDetails(token.value)
    console.log('邀请详情查询成功:', details)
    organizationName.value = details.organizationName
    inviterEmail.value = details.inviterEmail
    role.value = details.role || 'member'
    loading.value = false
    
    // 成功后清除 localStorage
    localStorage.removeItem('org_invitation_params')
  } catch (err) {
    console.error('获取邀请详情失败:', err)
    console.error('查询的 token:', token.value)
    console.error('查询的 organizationId:', organizationId.value)
    error.value = true
    errorMessage.value = `无法验证邀请信息，可能已过期或无效。Token: ${token.value?.substring(0, 8)}...`
    loading.value = false
  }
})

// 接受邀请
const acceptInvitation = async () => {
  processing.value = true
  try {
    const result = await acceptOrganizationInvitation(token.value, organizationId.value)
    success.value = true
    
    // 如果用户已经是成员，显示特殊消息
    if (result.alreadyMember) {
      organizationName.value = organizationName.value || '该组织'
    }
  } catch (err: any) {
    console.error('接受邀请失败:', err)
    error.value = true
    
    // 根据错误类型显示不同的提示信息
    if (err.message?.includes('邀请已过期')) {
      errorMessage.value = '邀请链接已过期，请联系邀请人重新发送邀请'
    } else if (err.message?.includes('邮箱') && err.message?.includes('不匹配')) {
      errorMessage.value = '邀请邮箱与当前登录账号不匹配，请使用正确的账号登录'
    } else if (err.message?.includes('未登录')) {
      errorMessage.value = '请先登录后再接受邀请'
    } else {
      errorMessage.value = `接受邀请失败：${err.message || '请稍后再试'}`
    }
  } finally {
    processing.value = false
  }
}

// 获取角色名称
const getRoleName = (role: string) => {
  const roleMap: Record<string, string> = {
    'admin': '管理员',
    'member': '成员'
  }
  return roleMap[role] || role
}

// 导航到组织页面
const goToOrganization = () => {
  router.push(`/organizations/${organizationId.value}`)
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