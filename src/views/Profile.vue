<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <h2>个人资料</h2>
          <el-button type="primary" @click="editMode = !editMode">
            {{ editMode ? '取消编辑' : '编辑资料' }}
          </el-button>
        </div>
      </template>

      <div class="profile-content">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <el-avatar :size="100" :src="userProfile.avatar_url">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div v-if="editMode" class="avatar-upload">
            <el-button size="small" type="text">更换头像</el-button>
          </div>
        </div>

        <!-- 基本信息 -->
        <el-form 
          ref="profileFormRef"
          :model="userProfile" 
          :rules="rules"
          label-width="100px"
          class="profile-form"
        >
          <el-form-item label="姓名" prop="full_name">
            <el-input 
              v-model="userProfile.full_name" 
              :disabled="!editMode"
              placeholder="请输入姓名"
            />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input 
              v-model="userProfile.email" 
              disabled
              placeholder="邮箱地址"
            />
            <div class="form-tip">邮箱地址不可修改</div>
          </el-form-item>

          <el-form-item label="注册时间">
            <el-input 
              :value="formatDate(userProfile.created_at)" 
              disabled
            />
          </el-form-item>
        </el-form>

        <!-- 密码修改区域 -->
        <el-divider content-position="left">密码设置</el-divider>
        
        <el-form 
          v-if="showPasswordForm"
          ref="passwordFormRef"
          :model="passwordForm" 
          :rules="passwordRules"
          label-width="100px"
          class="password-form"
        >
          <el-form-item label="当前密码" prop="currentPassword">
            <el-input 
              v-model="passwordForm.currentPassword" 
              type="password"
              placeholder="请输入当前密码"
              show-password
            />
          </el-form-item>

          <el-form-item label="新密码" prop="newPassword">
            <el-input 
              v-model="passwordForm.newPassword" 
              type="password"
              placeholder="请输入新密码"
              show-password
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input 
              v-model="passwordForm.confirmPassword" 
              type="password"
              placeholder="请确认新密码"
              show-password
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleUpdatePassword" :loading="updatingPassword">
              更新密码
            </el-button>
            <el-button @click="cancelPasswordUpdate">取消</el-button>
          </el-form-item>
        </el-form>

        <div v-else class="password-actions">
          <el-button type="text" @click="showPasswordForm = true">
            修改密码
          </el-button>
        </div>

        <!-- 操作按钮 -->
        <div v-if="editMode" class="form-actions">
          <el-button type="primary" @click="handleUpdateProfile" :loading="updating">
            保存修改
          </el-button>
          <el-button @click="cancelEdit">取消</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const authStore = useAuthStore()
const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

const editMode = ref(false)
const updating = ref(false)
const updatingPassword = ref(false)
const showPasswordForm = ref(false)

const userProfile = reactive({
  id: '',
  email: '',
  full_name: '',
  avatar_url: '',
  created_at: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  full_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, message: '姓名长度不能少于2位', trigger: 'blur' },
    { max: 20, message: '姓名长度不能超过20位', trigger: 'blur' }
  ]
}

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 加载用户资料
const loadUserProfile = async () => {
  if (!authStore.user) return
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authStore.user.id)
      .single()
    
    if (error) throw error
    
    if (data) {
      Object.assign(userProfile, data)
    } else {
      // 如果没有资料记录，创建一个
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: authStore.user.id,
          email: authStore.user.email,
          full_name: authStore.user.user_metadata?.full_name || ''
        })
      
      if (insertError) throw insertError
      
      // 重新加载
      await loadUserProfile()
    }
  } catch (error: any) {
    ElMessage.error('加载用户资料失败: ' + error.message)
    console.error('加载用户资料错误:', error)
  }
}

// 更新用户资料
const handleUpdateProfile = async () => {
  if (!profileFormRef.value) return
  
  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      updating.value = true
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            full_name: userProfile.full_name
          })
          .eq('id', authStore.user?.id)
        
        if (error) throw error
        
        ElMessage.success('资料更新成功')
        editMode.value = false
      } catch (error: any) {
        ElMessage.error('更新资料失败: ' + error.message)
        console.error('更新资料错误:', error)
      } finally {
        updating.value = false
      }
    }
  })
}

// 更新密码
const handleUpdatePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      updatingPassword.value = true
      try {
        const { error } = await supabase.auth.updateUser({
          password: passwordForm.newPassword
        })
        
        if (error) throw error
        
        ElMessage.success('密码更新成功')
        cancelPasswordUpdate()
      } catch (error: any) {
        ElMessage.error('更新密码失败: ' + error.message)
        console.error('更新密码错误:', error)
      } finally {
        updatingPassword.value = false
      }
    }
  })
}

// 取消编辑
const cancelEdit = () => {
  editMode.value = false
  loadUserProfile() // 重新加载原始数据
}

// 取消密码更新
const cancelPasswordUpdate = () => {
  showPasswordForm.value = false
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

onMounted(() => {
  loadUserProfile()
})
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.profile-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  color: #303133;
}

.profile-content {
  padding: 20px 0;
}

.avatar-section {
  text-align: center;
  margin-bottom: 30px;
}

.avatar-upload {
  margin-top: 10px;
}

.profile-form {
  max-width: 500px;
  margin: 0 auto;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.password-form {
  max-width: 500px;
  margin: 20px auto 0;
}

.password-actions {
  text-align: center;
  margin: 20px 0;
}

.form-actions {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.form-actions .el-button {
  margin: 0 10px;
}
</style>