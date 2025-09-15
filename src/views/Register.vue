<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1>注册 AIP</h1>
        <p>创建您的AI项目管理账户</p>
      </div>
      
      <el-form 
        ref="registerFormRef" 
        :model="registerForm" 
        :rules="rules"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="fullName">
          <el-input
            v-model="registerForm.fullName"
            placeholder="姓名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            type="email"
            placeholder="邮箱地址"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
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
            @click="handleRegister"
            style="width: 100%"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="register-footer">
        <p>已有账号？ 
          <router-link to="/login" class="link">立即登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { Message, Lock, User } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const registerFormRef = ref<FormInstance>()

const registerForm = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  fullName: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, message: '姓名长度不能少于2位', trigger: 'blur' },
    { max: 20, message: '姓名长度不能超过20位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await authStore.signUp(registerForm.email, registerForm.password, registerForm.fullName)
        ElMessage.success('注册成功，请查看邮箱确认账户')
        router.push('/login')
      } catch (error: any) {
        ElMessage.error(error.message || '注册失败')
      }
    }
  })
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-card {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.register-header p {
  color: #909399;
  font-size: 14px;
}

.register-footer {
  text-align: center;
  margin-top: 20px;
}

.register-footer p {
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