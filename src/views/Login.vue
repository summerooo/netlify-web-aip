<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>登录 AIP</h1>
        <p>AI项目管理平台</p>
      </div>
      
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="rules" 
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            type="email"
            placeholder="邮箱地址"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            :loading="authStore.loading"
            @click="handleLogin"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>还没有账号？ 
          <router-link to="/register" class="link">立即注册</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { Message, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref<FormInstance>()

const loginForm = reactive({
  email: '',
  password: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await authStore.signIn(loginForm.email, loginForm.password)
        ElMessage.success('登录成功')
        
        // 检查是否有 redirect 参数，如果有则跳转到指定地址
        const redirect = router.currentRoute.value.query.redirect as string
        if (redirect && redirect.startsWith('/')) {
          router.push(redirect)
        } else {
          router.push('/dashboard')
        }
      } catch (error: any) {
        ElMessage.error(error.message || '登录失败')
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.login-header p {
  color: #909399;
  font-size: 14px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}

.login-footer p {
  color: #909399;
  font-size: 14px;
}

.link {
  color: #409eff;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>