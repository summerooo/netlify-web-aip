<template>
  <div class="project-detail">
    <el-container>
      <div class="back-section">
        <el-button link size="small" @click="$router.back()" class="back-btn">
          <el-icon>
            <ArrowLeft />
          </el-icon>
          返回
        </el-button>
      </div>
      <el-header class="header">
        <div class="header-content">
          <div class="title-row">
            <h1>{{ project?.name }}</h1>
            <div class="header-actions">
              <el-tag :type="getStatusType(project?.status)" size="large">
                {{ project?.status }}
              </el-tag>
              <el-dropdown v-if="canManageProject" trigger="click" class="project-actions">
                <el-button type="primary" :icon="Setting" circle />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="openDeleteDialog">
                      <el-icon>
                        <Delete />
                      </el-icon>
                      删除项目
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <p class="project-description">{{ project?.description || '暂无描述' }}</p>
        </div>
      </el-header>

      <el-main class="main-content">
        <el-tabs v-model="activeTab" class="project-tabs">
          <el-tab-pane label="项目概览" name="overview">
            <div class="overview-content">
              <div class="stats-grid">
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon">
                      <el-icon color="#409eff">
                        <List />
                      </el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-number">{{ projectStats.totalTasks }}</div>
                      <div class="stat-label">总任务数</div>
                    </div>
                  </div>
                </el-card>

                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon">
                      <el-icon color="#67c23a">
                        <Check />
                      </el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-number">{{ projectStats.completedTasks }}</div>
                      <div class="stat-label">已完成</div>
                    </div>
                  </div>
                </el-card>

                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon">
                      <el-icon color="#e6a23c">
                        <Clock />
                      </el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-number">{{ projectStats.inProgressTasks }}</div>
                      <div class="stat-label">进行中</div>
                    </div>
                  </div>
                </el-card>

                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon">
                      <el-icon color="#909399">
                        <User />
                      </el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-number">{{ projectStats.totalMembers }}</div>
                      <div class="stat-label">团队成员</div>
                    </div>
                  </div>
                </el-card>
              </div>

              <div class="content-grid">
                <el-card class="recent-activities">
                  <template #header>
                    <span>最近活动</span>
                  </template>
                  <div class="activity-list">
                    <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
                      <div class="activity-avatar">
                        <el-icon>
                          <User />
                        </el-icon>
                      </div>
                      <div class="activity-content">
                        <p>{{ activity.description || activity.content }}</p>
                        <span class="activity-time">{{ formatTime(activity.created_at) }}</span>
                      </div>
                    </div>
                  </div>
                </el-card>

                <el-card class="ai-assistant">
                  <template #header>
                    <span>AI 项目助手</span>
                  </template>
                  <div class="ai-content">
                    <div class="ai-avatar">
                      <el-icon>
                        <Setting />
                      </el-icon>
                    </div>
                    <div class="ai-message">
                      <p>我是您的项目AI助手，可以帮助您分析项目进度、识别风险、优化任务分配。有什么需要帮助的吗？</p>
                    </div>
                  </div>
                  <el-button type="primary" style="width: 100%; margin-top: 16px;" @click="openAIChat">
                    开始对话
                  </el-button>
                </el-card>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="任务管理" name="tasks">
            <div class="tasks-section">
              <div class="tasks-header">
                <h3>项目任务</h3>
                <el-button type="primary" @click="showCreateTaskDialog = true">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  创建任务
                </el-button>
              </div>

              <div class="task-board">
                <div class="task-column">
                  <div class="column-header">
                    <h4>待办</h4>
                    <el-badge :value="todoTasks.length" />
                  </div>
                  <div class="task-list">
                    <div v-for="task in todoTasks" :key="task.id" class="task-card" @click="openTaskDetail(task)">
                      <h5>{{ task.title }}</h5>
                      <p>{{ task.description }}</p>
                      <div class="task-meta">
                        <el-tag size="small">{{ task.priority }}</el-tag>
                        <span class="assignee">{{ task.assigned_user?.full_name || task.assigned_user?.name || task.assigned_user?.email || '未分配'
                          }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="task-column">
                  <div class="column-header">
                    <h4>进行中</h4>
                    <el-badge :value="inProgressTasks.length" />
                  </div>
                  <div class="task-list">
                    <div v-for="task in inProgressTasks" :key="task.id" class="task-card" @click="openTaskDetail(task)">
                      <h5>{{ task.title }}</h5>
                      <p>{{ task.description }}</p>
                      <div class="task-meta">
                        <el-tag size="small" type="warning">{{ task.priority }}</el-tag>
                        <span class="assignee">{{ task.assigned_user?.display_name || task.assigned_user?.name || task.assigned_user?.email || '未分配' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="task-column">
                  <div class="column-header">
                    <h4>已完成</h4>
                    <el-badge :value="completedTasks.length" />
                  </div>
                  <div class="task-list">
                    <div v-for="task in completedTasks" :key="task.id" class="task-card completed"
                      @click="openTaskDetail(task)">
                      <h5>{{ task.title }}</h5>
                      <p>{{ task.description }}</p>
                      <div class="task-meta">
                        <el-tag size="small" type="success">{{ task.priority }}</el-tag>
                        <span class="assignee">{{ task.assigned_user?.full_name || task.assigned_user?.name || task.assigned_user?.email || '未分配'
                          }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="团队成员" name="members">
            <div class="members-section">
              <div class="members-header">
                <h3>项目成员</h3>
                <el-button type="primary" size="small" @click="showInviteMemberDialog = true">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  添加成员
                </el-button>
              </div>

              <div class="members-grid">
                <el-card v-for="member in projectMembers" :key="member.id" class="member-card">
                  <div class="member-info">
                    <el-avatar :size="48" :src="getMemberAvatar(member.email)" />
                    <div class="member-details">
                      <h4>{{ member.name || member.email }}</h4>
                      <p>{{ member.role }}</p>
                    </div>
                  </div>
                  <div class="member-stats">
                    <div class="stat-item">
                      <span class="stat-number">{{ member.taskCount || 0 }}</span>
                      <span class="stat-label">任务</span>
                    </div>
                    <div class="member-actions" v-if="member.user_id === authStore.user?.id">
                      <el-button type="danger" size="small" @click="showLeaveProjectDialog = true"
                        :loading="leavingProject">
                        退出项目
                      </el-button>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="知识库" name="knowledge">
            <div class="knowledge-section">
              <div class="knowledge-header">
                <h3>项目知识库</h3>
                <div class="knowledge-actions">
                  <el-input v-model="knowledgeSearchQuery" placeholder="搜索文档..."
                    style="width: 200px; margin-right: 12px;" clearable>
                    <template #prefix>
                      <el-icon>
                        <Search />
                      </el-icon>
                    </template>
                  </el-input>
                  <el-button type="primary" size="small" @click="showAddDocumentDialog = true">
                    <el-icon>
                      <Plus />
                    </el-icon>
                    添加文档
                  </el-button>
                </div>
              </div>

              <div class="knowledge-content">
                <div v-if="filteredKnowledgeItems.length === 0 && !knowledgeSearchQuery" class="empty-state">
                  <el-icon>
                    <Document />
                  </el-icon>
                  <h3>知识库为空</h3>
                  <p>添加项目相关文档来构建知识库</p>
                  <el-button type="primary" @click="showAddDocumentDialog = true">添加文档</el-button>
                </div>

                <div v-else-if="filteredKnowledgeItems.length === 0 && knowledgeSearchQuery" class="empty-state">
                  <el-icon>
                    <Search />
                  </el-icon>
                  <h3>未找到相关文档</h3>
                  <p>尝试使用其他关键词搜索</p>
                </div>

                <div v-else class="knowledge-grid">
                  <el-card v-for="item in filteredKnowledgeItems" :key="item.id" class="knowledge-item"
                    @click="openKnowledgeItem(item)">
                    <div class="knowledge-item-header">
                      <div class="knowledge-icon">
                        <el-icon v-if="item.type === 'document'">
                          <Document />
                        </el-icon>
                        <el-icon v-else-if="item.type === 'link'">
                          <Link />
                        </el-icon>
                        <el-icon v-else-if="item.type === 'note'">
                          <Edit />
                        </el-icon>
                        <el-icon v-else>
                          <Document />
                        </el-icon>
                      </div>
                      <div class="knowledge-meta">
                        <el-tag :type="getKnowledgeTypeColor(item.type)" size="small">
                          {{ getKnowledgeTypeName(item.type) }}
                        </el-tag>
                        <div @click.stop>
                          <el-dropdown trigger="click">
                            <el-button type="text" size="small">
                              <el-icon>
                                <MoreFilled />
                              </el-icon>
                            </el-button>
                            <template #dropdown>
                              <el-dropdown-menu>
                                <el-dropdown-item @click="editKnowledgeItem(item)">
                                  <el-icon>
                                    <Edit />
                                  </el-icon>
                                  编辑
                                </el-dropdown-item>
                                <el-dropdown-item @click="deleteKnowledgeItem(item)" divided>
                                  <el-icon>
                                    <Delete />
                                  </el-icon>
                                  删除
                                </el-dropdown-item>
                              </el-dropdown-menu>
                            </template>
                          </el-dropdown>
                        </div>
                      </div>
                    </div>
                    <div class="knowledge-item-content">
                      <h4>{{ item.title }}</h4>
                      <p>{{ item.description || '暂无描述' }}</p>
                      <div class="knowledge-item-footer">
                        <span class="author">{{ item.created_by_name || '未知' }}</span>
                        <span class="date">{{ formatTime(item.created_at) }}</span>
                      </div>
                    </div>
                  </el-card>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>

    <!-- 创建任务对话框 -->
    <el-dialog v-model="showCreateTaskDialog" title="创建任务" width="500px">
      <el-form :model="taskForm" label-width="80px">
        <el-form-item label="任务标题">
          <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="taskForm.description" type="textarea" :rows="3" placeholder="请输入任务描述" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="taskForm.priority" placeholder="请选择优先级">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派给">
          <el-select v-model="taskForm.assignee" placeholder="请选择成员">
            <el-option v-for="member in projectMembers" :key="member.id" :label="member.name || member.email"
              :value="member.user_id" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateTaskDialog = false">取消</el-button>
        <el-button type="primary" :loading="creatingTask" @click="handleCreateTask" :disabled="!taskForm.title">
          {{ creatingTask ? '创建中...' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加成员对话框 -->
    <el-dialog v-model="showInviteMemberDialog" title="添加项目成员" width="500px" @open="loadOrganizationMembers">
      <el-form :model="inviteForm" label-width="80px">
        <el-form-item label="选择成员">
          <el-select v-model="inviteForm.selectedMember" placeholder="请选择组织成员" filterable :loading="loadingOrgMembers">
            <el-option v-for="member in availableOrgMembers" :key="member.user_id"
              :label="member.email || member.user_id" :value="member.user_id">
              <div class="member-option">
                <span>{{ member.name || member.email || '未知用户' }}</span>
                <el-tag size="small" type="info">{{ member.role }}</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="项目角色">
          <el-select v-model="inviteForm.role" placeholder="请选择项目角色">
            <el-option label="管理员" value="manager" />
            <el-option label="开发者" value="developer" />
            <el-option label="设计师" value="designer" />
            <el-option label="测试员" value="tester" />
            <el-option label="普通成员" value="member" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showInviteMemberDialog = false">取消</el-button>
        <el-button type="primary" :loading="inviting" @click="handleAddMember" :disabled="!inviteForm.selectedMember">
          添加到项目
        </el-button>
      </template>
    </el-dialog>

    <!-- 邀请链接对话框 -->
    <el-dialog v-model="showInvitationLinkDialog" title="成员邀请链接" width="500px">
      <div class="invitation-link-content">
        <p>已成功创建成员邀请链接，您可以将此链接发送给新成员：</p>
        <div class="invitation-link-box">
          <el-input v-model="invitationLink" readonly size="large">
            <template #append>
              <el-button @click="copyInvitationLink">
                <el-icon>
                  <Document />
                </el-icon> 复制
              </el-button>
            </template>
          </el-input>
        </div>
        <div class="invitation-info">
          <p><strong>成员邮箱：</strong>{{ inviteForm.email }}</p>
          <p><strong>成员角色：</strong>{{ getRoleName(inviteForm.role) }}</p>
          <p><strong>链接有效期：</strong>7天</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="showInvitationLinkDialog = false">关闭</el-button>
        <el-button type="primary" @click="sendAnotherInvitation">添加另一个成员</el-button>
      </template>
    </el-dialog>

    <!-- 删除项目确认对话框 -->
    <el-dialog v-model="showDeleteDialog" title="删除项目" width="400px" :close-on-click-modal="false">
      <div class="delete-confirmation">
        <div class="warning-icon">
          <el-icon color="#E6A23C" size="48">
            <WarningFilled />
          </el-icon>
        </div>
        <div class="warning-text">
          <p><strong>确定要删除项目 "{{ project?.name }}" 吗？</strong></p>
          <p>此操作将永久删除项目及其所有相关数据，包括：</p>
          <ul>
            <li>项目中的所有任务</li>
            <li>项目成员关系</li>
            <li>项目相关文档</li>
          </ul>
          <p><strong>此操作不可撤销！</strong></p>
        </div>
      </div>

      <template #footer>
        <el-button @click="cancelDelete" :disabled="deleting">取消</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleting">
          {{ deleting ? '删除中...' : '确认删除' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 退出项目确认对话框 -->
    <el-dialog v-model="showLeaveProjectDialog" title="确认退出项目" width="400px" :close-on-click-modal="false">
      <div class="leave-dialog-content">
        <p>您确定要退出项目 <strong>{{ project?.name }}</strong> 吗？</p>
        <p class="warning-text">退出后，您将失去对该项目及其所有任务的访问权限。</p>
      </div>

      <template #footer>
        <el-button @click="showLeaveProjectDialog = false" :disabled="leavingProject">取消</el-button>
        <el-button type="danger" @click="leaveProject" :loading="leavingProject">
          {{ leavingProject ? '退出中...' : '确认退出' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加文档对话框 -->
    <el-dialog v-model="showAddDocumentDialog" title="添加知识库文档" width="600px">
      <el-form :model="documentForm" label-width="80px" :rules="documentRules" ref="documentFormRef">
        <el-form-item label="文档类型" prop="type">
          <el-radio-group v-model="documentForm.type">
            <el-radio label="document">文档</el-radio>
            <el-radio label="link">链接</el-radio>
            <el-radio label="note">笔记</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="documentForm.title" placeholder="请输入文档标题" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="documentForm.description" type="textarea" :rows="3" placeholder="请输入文档描述" />
        </el-form-item>
        <el-form-item v-if="documentForm.type === 'link'" label="链接地址" prop="url">
          <el-input v-model="documentForm.url" placeholder="请输入链接地址" />
        </el-form-item>
        <el-form-item v-if="documentForm.type === 'document'" label="文档内容" prop="content">
          <el-input v-model="documentForm.content" type="textarea" :rows="8" placeholder="请输入文档内容" />
        </el-form-item>
        <el-form-item v-if="documentForm.type === 'note'" label="笔记内容" prop="content">
          <el-input v-model="documentForm.content" type="textarea" :rows="6" placeholder="请输入笔记内容" />
        </el-form-item>

      </el-form>

      <template #footer>
        <el-button @click="showAddDocumentDialog = false">取消</el-button>
        <el-button type="primary" :loading="savingDocument" @click="handleSaveDocument">
          {{ savingDocument ? '保存中...' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 知识库详情对话框 -->
    <el-dialog v-model="showKnowledgeDetailDialog" :title="selectedKnowledgeItem?.title" width="800px"
      class="knowledge-detail-dialog">
      <div v-if="selectedKnowledgeItem" class="knowledge-detail-content">
        <div class="knowledge-detail-header">
          <div class="knowledge-detail-meta">
            <el-tag :type="getKnowledgeTypeColor(selectedKnowledgeItem.type)" size="small">
              {{ getKnowledgeTypeName(selectedKnowledgeItem.type) }}
            </el-tag>
            <span class="knowledge-detail-author">
              创建者：{{ selectedKnowledgeItem.created_by_name || '未知' }}
            </span>
            <span class="knowledge-detail-date">
              {{ formatTime(selectedKnowledgeItem.created_at || new Date().toISOString()) }}
            </span>
          </div>
          <div class="knowledge-detail-description" v-if="selectedKnowledgeItem.description">
            <p>{{ selectedKnowledgeItem.description }}</p>
          </div>
        </div>

        <div class="knowledge-detail-body">
          <div v-if="selectedKnowledgeItem.type === 'link'" class="link-content">
            <div class="link-preview">
              <el-icon>
                <Link />
              </el-icon>
              <div class="link-info">
                <h4>外部链接</h4>
                <a :href="selectedKnowledgeItem.url" target="_blank" class="external-link">
                  {{ selectedKnowledgeItem.url }}
                  <el-icon>
                    <TopRight />
                  </el-icon>
                </a>
              </div>
            </div>
          </div>

          <div v-else class="document-content">
            <div class="content-viewer markdown-body" v-html="renderMarkdown(selectedKnowledgeItem.content || '暂无内容')">
            </div>
          </div>


        </div>
      </div>

      <template #footer>
        <el-button @click="showKnowledgeDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="selectedKnowledgeItem && editKnowledgeItem(selectedKnowledgeItem)">
          <el-icon>
            <Edit />
          </el-icon>
          编辑
        </el-button>
      </template>
    </el-dialog>

    <!-- AI聊天对话框 -->
    <el-dialog v-model="showAIChatDialog" title="AI 项目助手" width="600px" class="ai-chat-dialog">
      <div class="chat-container">
        <div class="chat-messages" ref="chatMessagesRef">
          <div v-for="message in chatMessages" :key="message.id" 
               :class="['chat-message', message.type === 'user' ? 'user-message' : 'ai-message']">
            <div class="message-avatar">
              <el-icon v-if="message.type === 'user'">
                <User />
              </el-icon>
              <el-icon v-else>
                <Setting />
              </el-icon>
            </div>
            <div class="message-content">
              <div class="message-bubble">
                <div class="message-text markdown-body" v-html="renderMarkdown(message.content)"></div>
              </div>
              <div class="message-time">{{ formatChatTime(message.timestamp) }}</div>
            </div>
          </div>
          
          <!-- 加载指示器 -->
          <div v-if="isChatLoading" class="chat-message ai-message loading-message">
            <div class="message-avatar">
              <el-icon>
                <Setting />
              </el-icon>
            </div>
            <div class="message-content">
              <div class="message-bubble">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="chat-input-area">
          <div class="chat-actions">
            <el-button size="small" type="info" plain @click="clearChatHistory" 
                       :disabled="chatMessages.length === 0">
              <el-icon><Delete /></el-icon>
              清空记录
            </el-button>
          </div>
          <div class="chat-input-container">
            <el-input
              v-model="chatInput"
              type="textarea"
              :rows="3"
              placeholder="输入您的问题，例如：分析当前项目进度、有什么风险需要注意、帮我优化任务分配..."
              @keydown.ctrl.enter="sendChatMessage"
              :disabled="isChatLoading || !authStore.user?.id"
              resize="none"
              maxlength="1000"
              show-word-limit
            />
            <el-button 
              type="primary" 
              @click="sendChatMessage" 
              :loading="isChatLoading"
              :disabled="!chatInput.trim() || !authStore.user?.id"
              class="send-button"
            >
              <el-icon v-if="!isChatLoading"><Promotion /></el-icon>
              {{ isChatLoading ? '发送中...' : '发送' }}
            </el-button>
          </div>
          <div class="chat-tips">
            <span>💡 提示：按 Ctrl + Enter 快速发送消息</span>
            <span v-if="!authStore.user?.id" class="login-tip">⚠️ 需要登录才能使用AI助手</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog v-model="taskDetailVisible" title="任务详情" width="650px" class="task-detail-dialog">
      <div v-if="selectedTask" class="task-detail-content">
        <div class="task-header">
          <h3 class="task-title">{{ selectedTask.title }}</h3>
          <el-tag :type="getStatusTagType(selectedTask.status)" size="large" class="status-tag">
            {{ selectedTask.status }}
          </el-tag>
        </div>

        <div class="task-description">
          <h4>任务描述</h4>
          <p>{{ selectedTask.description || '暂无描述' }}</p>
        </div>

        <div class="task-meta-grid">
          <div class="meta-row">
            <div class="meta-item">
              <label class="meta-label">
                <el-icon>
                  <Flag />
                </el-icon>
                优先级
              </label>
              <el-tag :type="getPriorityType(selectedTask.priority)" size="small">
                {{ selectedTask.priority }}
              </el-tag>
            </div>

            <div class="meta-item">
              <label class="meta-label">
                <el-icon>
                  <Clock />
                </el-icon>
                状态
              </label>
              <el-select v-model="selectedTask.status" size="small" class="status-select"
                :disabled="selectedTask.status === '已完成'" @change="handleStatusChange">
                <el-option label="待办" value="待办" />
                <el-option label="进行中" value="进行中" />
                <el-option label="已完成" value="已完成" />
                <el-option label="已暂停" value="已暂停" />
              </el-select>
            </div>
          </div>

          <div class="meta-row">
            <div class="meta-item full-width">
              <label class="meta-label">
                <el-icon>
                  <User />
                </el-icon>
                负责人
              </label>
              <el-select v-model="selectedTask.assigned_to" size="small" class="assignee-select" placeholder="请选择负责人"
                clearable :disabled="selectedTask.status === '已完成'" @change="handleAssigneeChange">
                <el-option v-for="member in projectMembers" :key="member.user_id" :label="member.name || member.email"
                  :value="member.user_id">
                  <div class="assignee-option">
                    <span class="member-name">{{ member.name || member.email }}</span>
                    <el-tag size="small" type="info">{{ member.role }}</el-tag>
                  </div>
                </el-option>
              </el-select>
            </div>
          </div>

          <div class="meta-row" v-if="selectedTask.due_date">
            <div class="meta-item">
              <label class="meta-label">
                <el-icon>
                  <Calendar />
                </el-icon>
                截止日期
              </label>
              <span class="due-date">{{ formatDate(selectedTask.due_date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="taskDetailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, InputInstance } from 'element-plus'
import {
  ArrowLeft,
  List,
  Check,
  Clock,
  User,
  Setting,
  Plus,
  Document,
  Delete,
  WarningFilled,
  Flag,
  Calendar,
  Search,
  Link,
  Edit,
  MoreFilled,
  TopRight,
  Promotion
} from '@element-plus/icons-vue'
import {
  getProjectById,
  getProjectMembers,
  getProjectTasks,
  createTask,
  updateTaskStatus,
  updateTaskAssignee,
  inviteProjectMember,
  createProjectInvitation,
  deleteProject,
  removeProjectMember,
  getProjectActivities,
  createProjectActivity
} from '../api/projects'
import { getOrganizationMembers } from '../api/organizations'
import { useKnowledge } from '../composables/useKnowledge'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('overview')
const showCreateTaskDialog = ref(false)
const creatingTask = ref(false)
const showInviteMemberDialog = ref(false)
const showInvitationLinkDialog = ref(false)
const inviting = ref(false)
const invitationLink = ref('')
const showDeleteDialog = ref(false)
const deleting = ref(false)
const showLeaveProjectDialog = ref(false)
const leavingProject = ref(false)
const loadingOrgMembers = ref(false)
const organizationMembers = ref<OrganizationMember[]>([])

// 任务详情对话框
const taskDetailVisible = ref(false)
const selectedTask = ref<Task | null>(null)

// 定义知识库项目接口
interface KnowledgeItem {
  id: string
  type: 'document' | 'link' | 'note'
  title: string
  description?: string
  content?: string
  url?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  created_by_name?: string
  project_id: string
}

// 知识库相关
const showAddDocumentDialog = ref(false)
const showKnowledgeDetailDialog = ref(false)
const selectedKnowledgeItem = ref<KnowledgeItem | null>(null)
const savingDocument = ref(false)
const documentFormRef = ref<FormInstance | null>(null)

// 使用知识库 composable
const {
  knowledgeItems,
  knowledgeSearchQuery,
  filteredKnowledgeItems,
  loading: knowledgeLoading,
  getKnowledgeTypeName,
  getKnowledgeTypeColor,
  loadKnowledgeItems,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge
} = useKnowledge(route.params.id as string)

// 定义接口类型
interface Project {
  id: string
  name: string
  description: string
  status: string
  created_by: string
  organization_id: string
  created_at?: string
  updated_at?: string
}

interface ProjectMember {
  id: string
  user_id: string
  role: string
  name: string
  email: string
  joined_at?: string
  taskCount: number
}

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  assigned_to?: string | null
  assigned_user?: {
    name: string
    email: string
    full_name?: string
    display_name?: string
  } | null
  project_id: string
  created_at?: string
  due_date?: string | null
}

interface Activity {
  id: string
  content: string
  type: string
  created_at: string
  user_id?: string
  user_name?: string
  description?: string
}

interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: string
  joined_at?: string
  name: string
  email: string
  full_name?: string
  display_name?: string
}

const project = ref<Project | null>(null)
const projectMembers = ref<ProjectMember[]>([])
const tasks = ref<Task[]>([])
const recentActivities = ref<Activity[]>([])

interface TaskForm {
  title: string
  description: string
  priority: string
  assignee: string
}

interface InviteForm {
  selectedMember: string
  role: string
  email: string
}

const taskForm = reactive<TaskForm>({
  title: '',
  description: '',
  priority: '中',
  assignee: ''
})

const inviteForm = reactive<InviteForm>({
  selectedMember: '',
  role: 'member',
  email: ''
})

interface DocumentForm {
  id: string | undefined
  type: 'document' | 'link' | 'note'
  title: string
  description: string
  content: string
  url: string
}

const documentForm = reactive<DocumentForm>({
  id: undefined,
  type: 'document',
  title: '',
  description: '',
  content: '',
  url: ''
})

// 定义表单验证规则的类型
type ValidateRule = {
  required?: boolean;
  message: string;
  trigger: string;
  min?: number;
  max?: number;
  validator?: (rule: any, value: any, callback: (error?: Error) => void) => void;
};

const documentRules = {
  type: [
    { required: true, message: '请选择文档类型', trigger: 'change' }
  ] as ValidateRule[],
  title: [
    { required: true, message: '请输入文档标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
  ] as ValidateRule[],
  url: [
    { required: true, message: '请输入链接地址', trigger: 'blur', validator: (rule: any, value: string, callback: (error?: Error) => void) => {
      if (documentForm.type === 'link' && !value) {
        callback(new Error('请输入链接地址'))
      } else if (value && !/^https?:\/\/.+/.test(value)) {
        callback(new Error('请输入正确的链接地址'))
      } else {
        callback()
      }
    }}
  ] as ValidateRule[],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur', validator: (rule: any, value: any, callback: (error?: Error) => void) => {
      if (['document', 'note'].includes(documentForm.type) && !value) {
        callback(new Error('请输入内容'))
      } else {
        callback()
      }
    }}
  ] as ValidateRule[]
}

const projectStats = computed(() => {
  const totalTasks = tasks.value.length
  const completedTasks = tasks.value.filter(task => task.status === '已完成').length
  const inProgressTasks = tasks.value.filter(task => task.status === '进行中').length
  const totalMembers = projectMembers.value.length

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    totalMembers
  }
})

const todoTasks = computed(() => tasks.value.filter(task => task.status === '待办'))
const inProgressTasks = computed(() => tasks.value.filter(task => task.status === '进行中'))
const completedTasks = computed(() => tasks.value.filter(task => task.status === '已完成'))

// 检查当前用户是否可以管理项目（项目创建者或组织管理员）
const canManageProject = ref(false)

// 计算可用的组织成员（排除已经是项目成员的用户）
const availableOrgMembers = computed(() => {
  if (!organizationMembers.value || !projectMembers.value) return []

  const projectMemberIds = projectMembers.value.map(member => member.user_id)
  return organizationMembers.value.filter(member =>
    !projectMemberIds.includes(member.user_id)
  )
})

// 过滤后的知识库项目

// 检查项目管理权限
const checkProjectPermissions = async () => {
  if (!project.value || !authStore.user) {
    canManageProject.value = false
    return
  }

  // 项目创建者可以管理
  if (project.value.created_by === authStore.user.id) {
    canManageProject.value = true
    return
  }

  // 检查是否是组织管理员或创建者
  try {
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.value.organization_id)
      .eq('user_id', authStore.user.id)
      .single()

    if (memberData?.role === 'admin') {
      canManageProject.value = true
      return
    }

    // 检查是否是组织创建者
    const { data: orgData } = await supabase
      .from('organizations')
      .select('created_by')
      .eq('id', project.value.organization_id)
      .single()

    canManageProject.value = orgData?.created_by === authStore.user.id
  } catch (error) {
    console.error('检查权限失败:', error)
    canManageProject.value = false
  }
}

const getStatusType = (status: string | undefined) => {
  if (!status) return ''
  
  const statusMap: Record<string, string> = {
    '进行中': 'success',
    '已完成': 'info',
    '已暂停': 'warning',
    '计划中': '',
    '已取消': 'danger'
  }
  return statusMap[status] || 'info'
}

const getRoleName = (role: string) => {
  const roleMap: Record<string, string> = {
    'manager': '管理员',
    'developer': '开发者',
    'designer': '设计师',
    'tester': '测试员',
    'member': '普通成员'
  }
  return roleMap[role] || role
}

const getMemberAvatar = (email: string) => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${email}`
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

const loadProject = async () => {
  try {
    const data = await getProjectById(route.params.id as string)
    project.value = data
    // 项目加载完成后检查权限
    await checkProjectPermissions()
  } catch (error: any) {
    ElMessage.error('加载项目信息失败: ' + error.message)
  }
}

const loadProjectMembers = async () => {
  try {
    const data = await getProjectMembers(route.params.id as string)
    projectMembers.value = data
  } catch (error: any) {
    ElMessage.error('加载项目成员失败: ' + error.message)
  }
}

const loadTasks = async () => {
  try {
    const data = await getProjectTasks(route.params.id as string)
    tasks.value = data
  } catch (error: any) {
    ElMessage.error('加载任务列表失败: ' + error.message)
  }
}

const handleCreateTask = async () => {
  if (!taskForm.title) {
    ElMessage.warning('请输入任务标题')
    return
  }

  creatingTask.value = true
  try {
    if (!authStore.user?.id) {
      throw new Error('用户未登录')
    }

    await createTask({
      title: taskForm.title,
      description: taskForm.description,
      status: '待办', // 默认状态
      priority: taskForm.priority,
      project_id: route.params.id as string,
      assigned_to: taskForm.assignee || undefined
    })
    ElMessage.success('任务创建成功')
    showCreateTaskDialog.value = false

    // 添加到最近活动
    await addActivity(`创建了新任务"${taskForm.title}"`, 'task_created')

    // 重置表单
    taskForm.title = ''
    taskForm.description = ''
    taskForm.priority = '中'
    taskForm.assignee = ''

    // 重新加载任务列表和项目成员（更新任务统计）
    loadTasks()
    loadProjectMembers()
  } catch (error: any) {
    ElMessage.error('创建任务失败: ' + error.message)
    console.error('创建任务错误详情:', error)
  } finally {
    creatingTask.value = false
  }
}

// 加载组织成员列表
const loadOrganizationMembers = async () => {
  if (!project.value) return

  loadingOrgMembers.value = true
  try {
    const members = await getOrganizationMembers(project.value.organization_id)
    organizationMembers.value = members
  } catch (error: any) {
    ElMessage.error('加载组织成员失败: ' + error.message)
    console.error('加载组织成员错误详情:', error)
  } finally {
    loadingOrgMembers.value = false
  }
}

// 添加成员到项目
const handleAddMember = async () => {
  if (!inviteForm.selectedMember) {
    ElMessage.warning('请选择要添加的成员')
    return
  }

  inviting.value = true
  try {
    // 直接添加为项目成员
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: route.params.id as string,
        user_id: inviteForm.selectedMember,
        role: inviteForm.role
      })

    if (error) throw error

    ElMessage.success('成员添加成功')
    showInviteMemberDialog.value = false

    // 重置表单
    inviteForm.selectedMember = ''
    inviteForm.role = 'member'

    // 重新加载项目成员
    await loadProjectMembers()

  } catch (error: any) {
    ElMessage.error('添加成员失败: ' + error.message)
    console.error('添加成员错误详情:', error)
  } finally {
    inviting.value = false
  }
}

const copyInvitationLink = () => {
  navigator.clipboard.writeText(invitationLink.value)
    .then(() => {
      ElMessage.success('邀请链接已复制到剪贴板')
    })
    .catch(err => {
      console.error('复制失败:', err)
      ElMessage.error('复制失败，请手动复制')
    })
}

// 打开删除确认对话框
const openDeleteDialog = () => {
  showDeleteDialog.value = true
}

// 确认删除项目
const confirmDelete = async () => {
  deleting.value = true
  try {
    await deleteProject(route.params.id as string)
    ElMessage.success('项目删除成功')
    showDeleteDialog.value = false
    // 删除成功后返回上一页
    router.back()
  } catch (error: any) {
    ElMessage.error('删除项目失败: ' + error.message)
    console.error('删除项目错误详情:', error)
  } finally {
    deleting.value = false
  }
}

// 取消删除
const cancelDelete = () => {
  showDeleteDialog.value = false
}

// 退出项目
const leaveProject = async () => {
  if (!authStore.user?.id || !project.value?.id) return

  leavingProject.value = true
  try {
    // 调用API移除当前用户的项目成员身份
    await removeProjectMember(project.value.id, authStore.user.id)

    ElMessage.success('已成功退出项目')
    showLeaveProjectDialog.value = false

    // 退出后跳转到组织详情页面
    router.push(`/organizations/${project.value.organization_id}`)
  } catch (error: any) {
    console.error('退出项目失败:', error)
    ElMessage.error('退出项目失败: ' + (error.message || '未知错误'))
  } finally {
    leavingProject.value = false
  }
}

const sendAnotherInvitation = () => {
  showInvitationLinkDialog.value = false
  inviteForm.email = ''
  inviteForm.role = 'member'
  showInviteMemberDialog.value = true
}

// AI聊天相关状态
const showAIChatDialog = ref(false)
const chatMessages = ref<Array<{id: string, type: 'user' | 'ai', content: string, timestamp: Date}>>([])
const chatInput = ref('')
const isChatLoading = ref(false)
const chatMessagesRef = ref<HTMLElement | null>(null)

const scrollChatToBottom = () => {
  nextTick(() => {
    const el = chatMessagesRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

// 简易安全转义
const escapeHtml = (str: string) =>
  str.replace(/&/g, '&')
     .replace(/</g, '<')
     .replace(/>/g, '>')

// 轻量 Markdown 渲染（基础支持）
const renderMarkdown = (raw: string) => {
  if (!raw) return ''
  const text = raw.replace(/\r\n/g, '\n')
  // 保护代码块
  const codeBlocks: string[] = []
  let html = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang = '', code) => {
    const safe = escapeHtml(code)
    codeBlocks.push(`<pre class="code-block"><code class="language-${lang}">${safe}</code></pre>`)
    return `@@CODE_BLOCK_${codeBlocks.length - 1}@@`
  })
  // 行内代码
  html = html.replace(/`([^`\n]+)`/g, (_m, c) => `<code class="inline-code">${escapeHtml(c)}</code>`)
  // 标题
  html = html
    .replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
    .replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
  // 引用
  html = html.replace(/^\s*>\s?(.*)$/gm, '<blockquote>$1</blockquote>')
             .replace(/^\>\s?(.*)$/gm, '<blockquote>$1</blockquote>')
  // 无序列表
  html = html.replace(/(^|\n)(?:[-*+]\s+.+\n?)+/g, (block) => {
    const items = block.trim().split('\n').map(l => l.replace(/^[-*+]\s+/, '').trim()).filter(Boolean)
    return `\n<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>\n`
  })
  // 有序列表
  html = html.replace(/(^|\n)(?:\d+\.\s+.+\n?)+/g, (block) => {
    const items = block.trim().split('\n').map(l => l.replace(/^\d+\.\s+/, '').trim()).filter(Boolean)
    return `\n<ol>${items.map(i => `<li>${i}</li>`).join('')}</ol>\n`
  })
  // 加粗/斜体
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
             .replace(/\*([^*]+)\*/g, '<em>$1</em>')
             .replace(/__([^_]+)__/g, '<strong>$1</strong>')
             .replace(/_([^_]+)_/g, '<em>$1</em>')
  // 链接
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  // 段落
  html = html.split(/\n{2,}/).map(p => {
    if (/^\s*<\/?(h\d|ul|ol|li|pre|blockquote)/.test(p)) return p
    return `<p>${p.replace(/\n/g, '<br/>')}</p>`
  }).join('\n')
  // 还原代码块
  html = html.replace(/@@CODE_BLOCK_(\d+)@@/g, (_m, idx) => codeBlocks[Number(idx)] || '')
  return html
}

const openAIChat = () => {
  // 检查用户是否已登录
  if (!authStore.user?.id) {
    ElMessage.warning('请先登录后再使用AI助手')
    return
  }

  showAIChatDialog.value = true
  
  // 如果是第一次打开，添加欢迎消息
  if (chatMessages.value.length === 0) {
    const projectName = project.value?.name || '项目'
    const welcomeMessage = `您好！我是${projectName}的AI助手小助手。

我可以帮助您：
• 📊 分析项目进度和风险
• 👥 优化任务分配建议
• ❓ 回答项目管理相关问题
• 📈 生成项目报告和统计
• 💡 提供项目管理最佳实践
• 🔍 搜索项目知识库内容

当前项目概况：
• 项目状态：${project.value?.status || '未知'}
• 任务总数：${projectStats.value.totalTasks}个
• 完成任务：${projectStats.value.completedTasks}个
• 团队成员：${projectStats.value.totalMembers}人

请告诉我您需要什么帮助？`
    
    chatMessages.value.push({
      id: Date.now().toString(),
      type: 'ai',
      content: welcomeMessage,
      timestamp: new Date()
    })
    scrollChatToBottom()
  }
}

// 发送聊天消息
const sendChatMessage = async () => {
  if (!chatInput.value.trim() || isChatLoading.value) return

  // 检查用户登录状态
  if (!authStore.user?.id) {
    ElMessage.warning('请先登录后再使用AI助手')
    showAIChatDialog.value = false
    router.push('/login')
    return
  }

  const userMessage = chatInput.value.trim()
  chatInput.value = ''

  // 添加用户消息
  chatMessages.value.push({
    id: Date.now().toString(),
    type: 'user',
    content: userMessage,
    timestamp: new Date()
  })
  scrollChatToBottom()

  isChatLoading.value = true

  try {
    // 根据n8n工作流要求构建请求数据
    const requestData = {
      message: userMessage,
      project_id: project.value?.id || null,
      user_id: authStore.user.id // 确保用户ID存在
    }

    console.log('发送AI聊天请求:', requestData)

    // 验证必要参数
    if (!requestData.user_id) {
      throw new Error('用户身份验证失败，请重新登录')
    }

    if (!requestData.message) {
      throw new Error('消息内容不能为空')
    }

    // 调用指定的n8n接口
    const response = await fetch('https://n8n-anerlnxq.ap-southeast-1.clawcloudrun.com/webhook-test/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': authStore.user.id
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API响应错误:', response.status, errorText)
      
      // 尝试解析错误信息
      let errorMessage = errorText
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorText
      } catch (e) {
        // 使用原始错误文本
      }
      
      throw new Error(`HTTP ${response.status}: ${errorMessage}`)
    }

    // 优雅解析响应，兼容空体或非JSON
    const rawText = await response.text()
    let data: any = null
    if (rawText) {
      try {
        data = JSON.parse(rawText)
      } catch (e) {
        console.warn('响应非JSON，原文：', rawText)
        throw new Error(`服务返回非JSON响应：${rawText.slice(0, 200)}`)
      }
    } else {
      throw new Error('服务无响应内容（空响应体）')
    }

    console.log('AI响应数据:', data)

    // 检查响应格式
    if (!data.success) {
      throw new Error(data.message || data.error || '服务返回错误')
    }

    // 添加AI回复
    chatMessages.value.push({
      id: Date.now().toString(),
      type: 'ai',
      content: data.response || '抱歉，我现在无法处理您的请求，请稍后再试。',
      timestamp: new Date()
    })
    scrollChatToBottom()

    // 滚动到底部
    nextTick(() => {
      const chatContainer = document.querySelector('.chat-messages')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    })

  } catch (error: any) {
    console.error('AI聊天错误:', error)
    
    let errorMessage = '抱歉，AI服务暂时不可用。'
    
    // 根据错误类型提供更具体的错误信息
    if (error.message.includes('Failed to fetch')) {
      errorMessage += '请检查网络连接。'
    } else if (error.message.includes('用户ID不能为空')) {
      errorMessage = '用户身份验证失败，请重新登录后再试。'
      // 提示用户重新登录
      setTimeout(() => {
        ElMessageBox.confirm(
          '您的登录状态已失效，请重新登录后继续使用AI助手。',
          '登录已失效',
          {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          showAIChatDialog.value = false
          router.push('/login')
        }).catch(() => {
          // 用户取消
        })
      }, 1000)
    } else if (error.message.includes('HTTP 400')) {
      errorMessage += '请求参数错误，请重试。'
    } else if (error.message.includes('HTTP 401')) {
      errorMessage += '身份验证失败，请重新登录。'
    } else if (error.message.includes('HTTP 500')) {
      errorMessage += '服务器内部错误，请稍后再试。'
    } else {
      errorMessage += `错误详情：${error.message}`
    }
    
    // 添加错误消息
    chatMessages.value.push({
      id: Date.now().toString(),
      type: 'ai',
      content: errorMessage,
      timestamp: new Date()
    })
    scrollChatToBottom()
    
    ElMessage.error('AI聊天服务连接失败')
  } finally {
    isChatLoading.value = false
  }
}

// 清空聊天记录
const clearChatHistory = () => {
  ElMessageBox.confirm(
    '确定要清空所有聊天记录吗？此操作不可撤销。',
    '确认清空',
    {
      confirmButtonText: '清空',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    chatMessages.value = []
    ElMessage.success('聊天记录已清空')
    // 重新显示欢迎消息
    if (showAIChatDialog.value) {
      setTimeout(() => {
        openAIChat()
      }, 100)
    }
  }).catch(() => {
    // 用户取消操作
  })
  scrollChatToBottom()
}

// 格式化聊天时间
const formatChatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 打开任务详情对话框
const openTaskDetail = (task: any) => {
  selectedTask.value = task
  taskDetailVisible.value = true
}

// 获取优先级标签类型
const getPriorityType = (priority: string) => {
  switch (priority) {
    case '高': return 'danger'
    case '中': return 'warning'
    case '低': return 'info'
    default: return 'info'
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case '已完成': return 'success'
    case '进行中': return 'primary'
    case '待办': return 'info'
    case '已暂停': return 'warning'
    default: return 'info'
  }
}

// 格式化日期
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 处理任务状态变更
const handleStatusChange = async (newStatus: string) => {
  if (!selectedTask.value) return

  try {
    await updateTaskStatus(selectedTask.value.id, newStatus)
    ElMessage.success('任务状态更新成功')

    // 更新本地任务列表中的状态
    const taskIndex = tasks.value.findIndex(t => t.id === selectedTask.value!.id)
    if (taskIndex !== -1) {
      tasks.value[taskIndex].status = newStatus
    }

    // 添加到最近活动
    await addActivity(`将任务"${selectedTask.value!.title}"状态更改为"${newStatus}"`, 'task_status_changed')

  } catch (error: any) {
    ElMessage.error('更新任务状态失败: ' + error.message)
    console.error('更新任务状态错误:', error)
    // 恢复原状态
    if (selectedTask.value) {
      selectedTask.value.status = tasks.value.find(t => t.id === selectedTask.value!.id)?.status || ''
    }
  }
}

// 处理任务负责人变更
const handleAssigneeChange = async (newAssigneeId: string) => {
  if (!selectedTask.value) return

  try {
    await updateTaskAssignee(selectedTask.value.id, newAssigneeId)

    // 获取新负责人信息
    const newAssignee = newAssigneeId ? projectMembers.value.find(m => m.user_id === newAssigneeId) : null
    const assigneeName = newAssignee ? (newAssignee.name || newAssignee.email) : '未分配'

    ElMessage.success('任务负责人更新成功')

    // 更新本地任务列表中的负责人
    const taskIndex = tasks.value.findIndex(t => t.id === selectedTask.value!.id)
    if (taskIndex !== -1) {
      tasks.value[taskIndex].assigned_to = newAssigneeId
      tasks.value[taskIndex].assigned_user = newAssignee ? {
        name: newAssignee.name,
        email: newAssignee.email,
        full_name: newAssignee.name,
        display_name: newAssignee.name || newAssignee.email
      } : null
    }

    // 更新选中任务的负责人信息
    selectedTask.value!.assigned_to = newAssigneeId
    selectedTask.value!.assigned_user = newAssignee ? {
      name: newAssignee.name,
      email: newAssignee.email,
      full_name: newAssignee.name,
      display_name: newAssignee.name || newAssignee.email
    } : null

    // 添加到最近活动
    await addActivity(`将任务"${selectedTask.value!.title}"分配给"${assigneeName}"`, 'task_assigned')

    // 重新加载项目成员（更新任务统计）
    loadProjectMembers()

  } catch (error: any) {
    ElMessage.error('更新任务负责人失败: ' + error.message)
    console.error('更新任务负责人错误:', error)
    // 恢复原负责人
    selectedTask.value!.assigned_to = tasks.value.find(t => t.id === selectedTask.value!.id)?.assigned_to
  }
}

// 加载项目活动
const loadProjectActivities = async () => {
  try {
    const activities = await getProjectActivities(route.params.id as string)
    recentActivities.value = activities
  } catch (error) {
    console.warn('加载项目活动失败:', error)
    // 如果数据库表不存在，使用本地存储的活动记录
    const localActivities = localStorage.getItem(`project_activities_${route.params.id}`)
    if (localActivities) {
      try {
        recentActivities.value = JSON.parse(localActivities)
      } catch (e) {
        recentActivities.value = []
      }
    }
  }
}

// 添加活动记录的辅助函数
const addActivity = async (description: string, activityType: string = 'general') => {
  try {
    // 使用Supabase API创建活动记录
    await createProjectActivity(route.params.id as string, description, activityType)
    // 重新加载活动列表以获取最新数据
    await loadProjectActivities()
  } catch (error: any) {
    console.error('创建活动记录失败:', error)
    ElMessage.warning('活动记录可能未保存')
  }
}

// 知识库相关方法已从 useKnowledge composable 中导入，不需要重复定义

// 打开知识库项目详情
const openKnowledgeItem = (item: KnowledgeItem) => {
  selectedKnowledgeItem.value = item
  showKnowledgeDetailDialog.value = true
}

// 编辑知识库项目
const editKnowledgeItem = (item: KnowledgeItem) => {
  documentForm.type = item.type
  documentForm.title = item.title
  documentForm.description = item.description || ''
  documentForm.content = item.content || ''
  documentForm.url = item.url || ''

  // 设置编辑模式
  documentForm.id = item.id
  showKnowledgeDetailDialog.value = false
  showAddDocumentDialog.value = true
}

// 删除知识库项目
const deleteKnowledgeItem = async (item: KnowledgeItem) => {
  try {
    // 确保必要的字段存在
    const itemToDelete = {
      ...item,
      created_by: item.created_by || authStore.user?.id || '',
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    }
    await deleteKnowledge(itemToDelete)
    // 添加到活动记录
    await addActivity(`删除了知识库文档"${item.title}"`, 'knowledge_deleted')
  } catch (error: any) {
    // 错误已在 composable 中处理
  }
}

// 保存文档
const handleSaveDocument = async () => {
  if (!documentFormRef.value) return

  try {
    await documentFormRef.value.validate()
  } catch (error: any) {
    return
  }

  savingDocument.value = true

  try {
    const isEdit = !!documentForm.id
    const now = new Date().toISOString()

    if (isEdit) {
      // 编辑模式
      await updateKnowledge(documentForm.id as string, {
        type: documentForm.type,
        title: documentForm.title,
        description: documentForm.description,
        content: documentForm.content,
        url: documentForm.url
      })
      await addActivity(`更新了知识库文档"${documentForm.title}"`, 'knowledge_updated')
    } else {
      // 新增模式
      await createKnowledge({
        type: documentForm.type,
        title: documentForm.title,
        description: documentForm.description,
        content: documentForm.content,
        url: documentForm.url
      })
      await addActivity(`添加了知识库文档"${documentForm.title}"`, 'knowledge_created')
    }

    showAddDocumentDialog.value = false
    resetDocumentForm()
    
    // 通知外部组件知识库已更新
    try {
      localStorage.setItem('knowledge_updated', Date.now().toString())
      window.dispatchEvent(new StorageEvent('storage', { key: 'knowledge_updated' }))
    } catch (error) {
      console.warn('无法发送知识库更新通知:', error)
    }
    
    // 通知其他页面更新知识库数据
    localStorage.setItem('knowledge_updated', Date.now().toString())

  } catch (error: any) {
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    savingDocument.value = false
  }
}



// 重置文档表单
const resetDocumentForm = () => {
  documentForm.id = undefined
  documentForm.type = 'document'
  documentForm.title = ''
  documentForm.description = ''
  documentForm.content = ''
  documentForm.url = ''

  if (documentFormRef.value) {
    documentFormRef.value.resetFields()
  }
}

watch(chatMessages, () => {
  scrollChatToBottom()
})

onMounted(() => {
  loadProject()
  loadProjectMembers()
  loadTasks()
  loadProjectActivities()
  loadKnowledgeItems()
})
</script>

<style scoped>
.project-detail {
  height: 100vh;
  background: #f5f7fa;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 12px 20px 16px 20px;
  box-sizing: border-box;
  height: auto;
}

.back-section {
  padding: 12px 20px 16px 20px;
  /* margin-bottom: 12px; */
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  padding: 2px 0;
  margin: 0;
  border: none;
  background: none;
  font-size: 14px;
}

.back-btn .el-icon {
  font-size: 14px;
}

.back-btn:hover {
  color: #409eff;
  background: none;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-row h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.project-description {
  margin: 0;
  color: #909399;
  font-size: 13px;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 10px;
}

.project-info h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.project-info p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #909399;
}

.main-content {
  padding: 20px;
}

.project-tabs {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.overview-content {
  max-width: 1200px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
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
  border-radius: 8px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  gap: 12px;
}

.activity-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f9ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  flex-shrink: 0;
}

.activity-content p {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #303133;
}

.activity-time {
  font-size: 12px;
  color: #c0c4cc;
}

.ai-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.ai-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.ai-message {
  flex: 1;
  background: #f5f7fa;
  padding: 12px 16px;
  border-radius: 12px;
  border-top-left-radius: 4px;
}

.ai-message p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.tasks-section {
  max-width: 1200px;
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tasks-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.task-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.task-column {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  min-height: 400px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e9ecef;
}

.column-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.2s;
}

.task-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.task-card.completed {
  opacity: 0.7;
}

.task-card h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.task-card p {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assignee {
  font-size: 12px;
  color: #606266;
}

.members-section {
  max-width: 800px;
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.members-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.member-card {
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #e4e7ed;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.member-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.02) 0%, rgba(64, 158, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.member-card:hover {
  border-color: #409eff;
  box-shadow:
    0 12px 32px rgba(64, 158, 255, 0.12),
    0 4px 16px rgba(64, 158, 255, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transform: translateY(-4px) scale(1.02);
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
}

.member-card:hover::before {
  opacity: 1;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.member-details h4 {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.member-details p {
  margin: 0;
  font-size: 13px;
  color: #909399;
  padding: 2px 8px;
  background: #f0f2f5;
  border-radius: 12px;
  display: inline-block;
  font-weight: 500;
}

.member-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.stat-item {
  text-align: center;
  flex: 1;
  padding: 12px 8px;
  border-radius: 12px;
  background: rgba(64, 158, 255, 0.05);
  transition: all 0.3s ease;
  position: relative;
}

.stat-item:hover {
  background: rgba(64, 158, 255, 0.1);
  transform: translateY(-2px);
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
  margin-bottom: 4px;
  text-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
}

.stat-label {
  font-size: 11px;
  color: #909399;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
}

.member-card:hover .stat-number {
  background: linear-gradient(135deg, #409eff 0%, #5daf34 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.knowledge-section {
  max-width: 1200px;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.knowledge-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.knowledge-actions {
  display: flex;
  align-items: center;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.knowledge-item {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  overflow: hidden;
}

.knowledge-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.knowledge-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.knowledge-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.knowledge-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.knowledge-item-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.knowledge-item-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #909399;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.knowledge-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #c0c4cc;
}

.knowledge-item-footer .author {
  font-weight: 500;
  color: #909399;
}

/* 知识库详情对话框样式 */
.knowledge-detail-dialog .el-dialog__body {
  padding: 24px;
}

.knowledge-detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.knowledge-detail-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.knowledge-detail-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.knowledge-detail-author,
.knowledge-detail-date {
  font-size: 13px;
  color: #909399;
}

.knowledge-detail-description p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.knowledge-detail-body {
  margin-bottom: 24px;
}

.link-content .link-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  border: 1px solid #b3e5fc;
}

.link-preview .el-icon {
  font-size: 32px;
  color: #409eff;
}

.link-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.external-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.external-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.document-content .content-viewer {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e4e7ed;
}

/* Markdown 基础样式 */
.markdown-body {
  font-size: 14px;
  line-height: 1.7;
  color: #303133;
  word-wrap: break-word;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin: 12px 0 8px;
  font-weight: 600;
}

.markdown-body p {
  margin: 8px 0;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 20px;
  margin: 8px 0;
}

.markdown-body blockquote {
  margin: 8px 0;
  padding: 8px 12px;
  border-left: 4px solid #409eff;
  background: #f5f7fa;
  color: #606266;
  border-radius: 4px;
}

.markdown-body a {
  color: #409eff;
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.inline-code {
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 0 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 90%;
}

/* 代码块样式 */
.code-block {
  background: #0d1117;
  color: #c9d1d9;
  border-radius: 8px;
  padding: 12px;
  overflow: auto;
  border: 1px solid #30363d;
}

.code-block code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  white-space: pre;
}

/* 保留旧 viewer 的基础排版 */
.content-viewer pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
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

.invitation-link-content {
  padding: 16px 0;
}

.invitation-link-box {
  margin: 16px 0;
}

.invitation-info {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.invitation-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .task-board {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .members-grid {
    grid-template-columns: 1fr;
  }
}

/* 项目操作按钮样式 */
.project-actions {
  margin-left: 12px;
}

/* 成员操作样式 */
.member-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(-4px);
}

.member-card:hover .member-actions {
  opacity: 1;
  transform: translateY(0);
}

.member-actions .el-button {
  padding: 6px 14px;
  font-size: 12px;
  border-radius: 20px;
  font-weight: 500;
  border: 1px solid rgba(245, 108, 108, 0.3);
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.member-actions .el-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.member-actions .el-button:hover {
  background: linear-gradient(135deg, #ff5252 0%, #e53935 100%);
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4);
  transform: translateY(-2px);
  border-color: rgba(245, 108, 108, 0.5);
}

.member-actions .el-button:hover::before {
  left: 100%;
}

.member-actions .el-button:active {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

/* 删除确认对话框样式 */
.delete-confirmation {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* 退出项目对话框样式 */
.leave-dialog-content {
  text-align: center;
  padding: 32px 24px;
  background: linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%);
  border-radius: 12px;
  margin: -20px -24px 20px -24px;
  position: relative;
}

.leave-dialog-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ff6b6b, #ee5a52, #ff6b6b);
  border-radius: 12px 12px 0 0;
}

.leave-dialog-content p {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
  line-height: 1.5;
}

.leave-dialog-content strong {
  color: #409eff;
  font-weight: 600;
}

.leave-dialog-content .warning-text {
  color: #f56c6c;
  margin-top: 20px;
  font-size: 14px;
  background: rgba(245, 108, 108, 0.1);
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #f56c6c;
  display: inline-block;
  font-weight: 500;
}

.warning-icon {
  margin-bottom: 16px;
}

.warning-text {
  color: #606266;
  line-height: 1.6;
}

.warning-text p {
  margin: 8px 0;
}

.warning-text ul {
  text-align: left;
  margin: 12px 0;
  padding-left: 20px;
}

.warning-text li {
  margin: 4px 0;
  color: #909399;
}

.warning-text strong {
  color: #E6A23C;
}

/* 成员选择器样式 */
.member-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.member-option span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-option .el-tag {
  margin-left: 8px;
  flex-shrink: 0;
}

/* 任务详情对话框样式 */
.task-detail-dialog .el-dialog__body {
  padding: 24px;
}

.task-detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.task-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  margin-right: 16px;
  line-height: 1.4;
}

.status-tag {
  flex-shrink: 0;
}

.task-description {
  margin-bottom: 24px;
}

.task-description h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  display: flex;
  align-items: center;
}

.task-description p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.task-meta-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meta-row {
  display: flex;
  gap: 24px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.meta-item.full-width {
  flex: 1;
}

.meta-label {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-label .el-icon {
  font-size: 14px;
  color: #909399;
}

.status-select {
  width: 120px;
}

.assignee-select {
  width: 100%;
}

.assignee-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.member-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

.due-date {
  color: #606266;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

/* 任务详情对话框响应式 */
@media (max-width: 768px) {
  .task-detail-dialog {
    width: 95% !important;
    margin: 0 auto;
  }

  .meta-row {
    flex-direction: column;
    gap: 16px;
  }

  .task-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .status-tag {
    align-self: flex-start;
  }
}

/* AI聊天对话框样式 */
.ai-chat-dialog .el-dialog__body {
  padding: 0;
  height: 600px;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  background: #f8f9fa;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.chat-message {
  display: flex;
  gap: 12px;
  animation: fadeInUp 0.3s ease-out;
}

.chat-message.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

.user-message .message-avatar {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.ai-message .message-avatar {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.user-message .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-message .message-bubble {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
  border-bottom-right-radius: 6px;
}

.ai-message .message-bubble {
  background: white;
  color: #303133;
  border: 1px solid #e4e7ed;
  border-bottom-left-radius: 6px;
}

.message-text {
  margin: 0;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.user-message .message-text {
  color: white;
}

.message-time {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 4px;
  padding: 0 4px;
}

.user-message .message-time {
  text-align: right;
}

.chat-input-area {
  background: white;
  border-top: 1px solid #e4e7ed;
  padding: 16px 20px;
}

.chat-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.chat-input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input-container .el-textarea {
  flex: 1;
}

.send-button {
  height: 40px;
  padding: 0 20px;
  border-radius: 20px;
  font-weight: 500;
}

.login-tip {
  color: #f56c6c !important;
  background: rgba(245, 108, 108, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
  margin-left: 16px;
}

.chat-tips {
  margin-top: 8px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.chat-tips span {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 4px 12px;
  border-radius: 12px;
  display: inline-block;
}

/* 加载动画 */
.loading-message .message-bubble {
  background: #f0f9ff;
  border: 1px solid #b3e5fc;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 聊天对话框响应式 */
@media (max-width: 768px) {
  .ai-chat-dialog {
    width: 95% !important;
    margin: 0 auto;
  }
  
  .ai-chat-dialog .el-dialog__body {
    height: 500px;
  }
  
  .chat-container {
    height: 500px;
  }
  
  .message-content {
    max-width: 85%;
  }
  
  .chat-input-container {
    flex-direction: column;
    gap: 8px;
  }
  
  .send-button {
    width: 100%;
    height: 36px;
  }
}
</style>
