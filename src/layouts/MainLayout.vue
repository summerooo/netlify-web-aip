<template>
  <div class="main-layout">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h1>AIP 项目管理平台</h1>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="32" :src="userAvatar" />
              <span class="username">{{ displayName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="settings">设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-container>
        <el-aside width="250px" class="sidebar">
          <el-menu
            :default-active="$route.path"
            router
            class="sidebar-menu"
          >
            <el-menu-item index="/dashboard">
              <el-icon><House /></el-icon>
              <span>工作台</span>
            </el-menu-item>
            <el-menu-item index="/organizations">
              <el-icon><OfficeBuilding /></el-icon>
              <span>组织管理</span>
            </el-menu-item>
            <el-menu-item index="/projects">
              <el-icon><Folder /></el-icon>
              <span>项目管理</span>
            </el-menu-item>
            <el-menu-item index="/tasks">
              <el-icon><List /></el-icon>
              <span>任务管理</span>
            </el-menu-item>
            <el-menu-item index="/knowledge">
              <el-icon><Document /></el-icon>
              <span>知识库</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  House, 
  OfficeBuilding, 
  Folder, 
  List, 
  Document, 
  ArrowDown
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const router = useRouter()
const authStore = useAuthStore()

const userProfile = ref<{ full_name?: string }>({})

const userAvatar = computed(() => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${authStore.user?.email}`
})

const displayName = computed(() => {
  return userProfile.value.full_name || authStore.user?.email || '用户'
})

// 获取用户资料
const loadUserProfile = async () => {
  if (!authStore.user) return
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', authStore.user.id)
      .single()
    
    if (data) {
      userProfile.value = data
    }
  } catch (error) {
    console.error('获取用户资料失败:', error)
  }
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      ElMessage.info('设置功能开发中')
      break
    case 'logout':
      await authStore.signOut()
      ElMessage.success('已退出登录')
      router.push('/login')
      break
  }
}

onMounted(() => {
  loadUserProfile()
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #606266;
}

.sidebar {
  background: white;
  border-right: 1px solid #e4e7ed;
}

.sidebar-menu {
  border: none;
}

.main-content {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>