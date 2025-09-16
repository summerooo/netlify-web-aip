<template>
  <div class="simple-ai-chat">
    <div class="chat-header">
      <h3>AI助手</h3>
      <select v-model="selectedProjectId" class="project-select">
        <option value="">选择项目（可选）</option>
        <option v-for="project in projects" :key="project.id" :value="project.id">
          {{ project.name }}
        </option>
      </select>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div v-for="msg in messages" :key="msg.id" class="message" :class="msg.type">
        <div class="message-content">
          <div class="message-text">{{ msg.text }}</div>
          <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
        </div>
      </div>
      
      <div v-if="isLoading" class="message ai">
        <div class="message-content">
          <div class="message-text">AI正在思考中...</div>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <input
        v-model="inputMessage"
        @keyup.enter="sendMessage"
        :disabled="isLoading"
        placeholder="输入您的问题..."
        class="input-field"
      />
      <button @click="sendMessage" :disabled="isLoading || !inputMessage.trim()" class="send-button">
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { sendSimpleAIMessage, getUserProjects } from '../api/simple-ai-chat'

interface Message {
  id: string
  type: 'user' | 'ai'
  text: string
  timestamp: Date
}

const messages = ref<Message[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const selectedProjectId = ref('')
const projects = ref<any[]>([])
const messagesContainer = ref<HTMLElement>()

// 加载项目列表
onMounted(async () => {
  try {
    projects.value = await getUserProjects()
  } catch (error) {
    console.error('加载项目列表失败:', error)
  }
  
  // 添加欢迎消息
  addMessage('ai', '您好！我是AI项目管理助手，有什么可以帮助您的吗？')
})

// 添加消息
function addMessage(type: 'user' | 'ai', text: string) {
  messages.value.push({
    id: Date.now().toString(),
    type,
    text,
    timestamp: new Date()
  })
  
  nextTick(() => {
    scrollToBottom()
  })
}

// 发送消息
async function sendMessage() {
  if (!inputMessage.value.trim() || isLoading.value) return
  
  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''
  
  // 添加用户消息
  addMessage('user', userMessage)
  
  // 开始加载
  isLoading.value = true
  
  try {
    // 发送到AI服务
    const response = await sendSimpleAIMessage(userMessage, selectedProjectId.value || undefined)
    
    // 添加AI回复
    addMessage('ai', response.response)
    
  } catch (error) {
    console.error('发送消息失败:', error)
    addMessage('ai', '抱歉，我现在无法回复您的消息。请稍后再试。')
  } finally {
    isLoading.value = false
  }
}

// 滚动到底部
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化时间
function formatTime(timestamp: Date) {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.simple-ai-chat {
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  background: white;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
}

.chat-header h3 {
  margin: 0;
  color: #2c3e50;
}

.project-select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.ai {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
}

.message.user .message-content {
  background: #007bff;
  color: white;
}

.message.ai .message-content {
  background: #f1f3f4;
  color: #2c3e50;
}

.message-text {
  margin-bottom: 4px;
  line-height: 1.4;
  white-space: pre-wrap;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
}

.chat-input {
  display: flex;
  padding: 16px;
  border-top: 1px solid #e1e5e9;
  gap: 8px;
}

.input-field {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  outline: none;
  font-size: 14px;
}

.input-field:focus {
  border-color: #007bff;
}

.send-button {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.send-button:hover:not(:disabled) {
  background: #0056b3;
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>