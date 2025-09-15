import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProjectKnowledge, createKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem } from '../api/knowledge'
import type { KnowledgeItem } from '../api/knowledge'
import { supabase } from '../lib/supabase'

export function useKnowledge(projectId: string) {
  const knowledgeItems = ref<KnowledgeItem[]>([])
  const knowledgeSearchQuery = ref('')
  const loading = ref(false)

  // 过滤后的知识库项目
  const filteredKnowledgeItems = computed(() => {
    if (!knowledgeSearchQuery.value) {
      return knowledgeItems.value
    }

    const query = knowledgeSearchQuery.value.toLowerCase()
    return knowledgeItems.value.filter(item =>
      item.title.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      (item.content && item.content.toLowerCase().includes(query))
    )
  })

  // 获取知识库类型名称
  const getKnowledgeTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'document': '文档',
      'link': '链接',
      'note': '笔记'
    }
    return typeMap[type] || '文档'
  }

  // 获取知识库类型颜色
  const getKnowledgeTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'document': 'primary',
      'link': 'success',
      'note': 'warning'
    }
    return colorMap[type] || 'primary'
  }

  // 检查用户是否为项目成员
  const checkProjectMembership = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .limit(1)

      if (error) {
        console.error('检查项目成员关系失败:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('检查项目成员关系失败:', error)
      return false
    }
  }

  // 加载知识库项目
  const loadKnowledgeItems = async () => {
    loading.value = true
    try {
      // 先检查用户是否为项目成员
      const isMember = await checkProjectMembership()
      if (!isMember) {
        console.warn('用户不是项目成员，无法访问知识库')
        knowledgeItems.value = []
        return
      }

      const items = await getProjectKnowledge(projectId)
      knowledgeItems.value = items
      console.log('从 Supabase 加载知识库数据:', knowledgeItems.value)
    } catch (error) {
      console.error('加载知识库数据失败:', error)
      ElMessage.error('加载知识库数据失败')
      knowledgeItems.value = []
    } finally {
      loading.value = false
    }
  }

  // 创建知识库项目
  const createKnowledge = async (data: {
    title: string
    description?: string
    content?: string
    type: 'document' | 'link' | 'note'
    url?: string
    tags?: string[]
  }) => {
    try {
      const newItem = await createKnowledgeItem({
        ...data,
        project_id: projectId
      })
      knowledgeItems.value.unshift(newItem)
      ElMessage.success('文档创建成功')
      return newItem
    } catch (error) {
      console.error('创建知识库项目失败:', error)
      ElMessage.error('创建文档失败')
      throw error
    }
  }

  // 更新知识库项目
  const updateKnowledge = async (itemId: string, updates: {
    title?: string
    description?: string
    content?: string
    type?: 'document' | 'link' | 'note'
    url?: string
    tags?: string[]
  }) => {
    try {
      const updatedItem = await updateKnowledgeItem(itemId, updates)
      const index = knowledgeItems.value.findIndex(item => item.id === itemId)
      if (index !== -1) {
        knowledgeItems.value[index] = updatedItem
      }
      ElMessage.success('文档更新成功')
      return updatedItem
    } catch (error) {
      console.error('更新知识库项目失败:', error)
      ElMessage.error('更新文档失败')
      throw error
    }
  }

  // 删除知识库项目
  const deleteKnowledge = async (item: KnowledgeItem) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除文档"${item.title}"吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )

      await deleteKnowledgeItem(item.id)
      const index = knowledgeItems.value.findIndex(k => k.id === item.id)
      if (index !== -1) {
        knowledgeItems.value.splice(index, 1)
      }
      ElMessage.success('文档删除成功')
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除知识库项目失败:', error)
        ElMessage.error('删除文档失败')
      }
    }
  }

  return {
    knowledgeItems,
    knowledgeSearchQuery,
    filteredKnowledgeItems,
    loading,
    getKnowledgeTypeName,
    getKnowledgeTypeColor,
    loadKnowledgeItems,
    createKnowledge,
    updateKnowledge,
    deleteKnowledge
  }
}