# 🤖 简单AI聊天设置指南

## 概述

这是一个简单的AI聊天功能，使用Supabase数据和n8n云端服务。用户可以与AI助手对话，AI会根据选择的项目提供相关建议。

## 功能特性

- ✅ 简单易用的聊天界面
- ✅ 项目上下文感知（可选择项目）
- ✅ 基于Supabase项目数据的智能回复
- ✅ 实时对话体验

## 快速开始

### 1. 环境配置

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑 .env 文件，填入以下配置：
VITE_SUPABASE_URL=你的Supabase项目URL
VITE_SUPABASE_ANON_KEY=你的Supabase匿名密钥
VITE_N8N_WEBHOOK_URL=你的n8n webhook URL
OPENAI_API_KEY=你的OpenAI API密钥
```

### 2. 自动化设置（推荐）

```bash
# 运行自动化设置脚本
node scripts/setup-simple-ai-chat.js \
  --n8n-url=https://your-instance.app.n8n.cloud \
  --api-key=your-n8n-api-key \
  --openai-key=your-openai-key
```

### 3. 手动设置

如果自动化设置失败，可以手动配置：

#### 3.1 在n8n中创建凭据

1. **OpenAI API凭据**
   - 名称: `openai-api`
   - API Key: 你的OpenAI API密钥

2. **Supabase API凭据**
   - 名称: `supabase-api`
   - Host: 你的Supabase URL
   - Service Role Secret: 你的Supabase service role密钥

#### 3.2 导入工作流

1. 复制 `n8n_workflows/simple-ai-chat-workflow.json` 的内容
2. 在n8n中点击 "Import from JSON"
3. 粘贴内容并导入
4. 激活工作流
5. 复制webhook URL到 `.env` 文件

### 4. 在项目中使用

#### 4.1 在Vue组件中使用

```vue
<template>
  <div>
    <SimpleAIChat />
  </div>
</template>

<script setup>
import SimpleAIChat from '@/components/SimpleAIChat.vue'
</script>
```

#### 4.2 API调用示例

```javascript
import { sendSimpleAIMessage } from '@/api/simple-ai-chat'

// 发送消息
const response = await sendSimpleAIMessage('你好，请介绍一下项目管理的最佳实践')

// 带项目上下文的消息
const response = await sendSimpleAIMessage('这个项目的进度如何？', 'project-id')
```

## 工作流说明

### 节点流程

1. **聊天请求** - 接收用户消息
2. **检查项目ID** - 判断是否有项目上下文
3. **获取项目信息** - 从Supabase获取项目详情（如果有项目ID）
4. **AI回复** - 使用OpenAI生成回复
5. **返回回复** - 返回AI回复给用户

### 请求格式

```json
{
  "message": "用户消息",
  "project_id": "项目ID（可选）"
}
```

### 响应格式

```json
{
  "response": "AI回复内容",
  "timestamp": "2025-01-16T10:00:00.000Z"
}
```

## 测试

### 1. 测试webhook

```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好，请介绍一下你的功能"
  }'
```

### 2. 测试带项目上下文

```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "这个项目的状态如何？",
    "project_id": "your-project-id"
  }'
```

## 故障排除

### 常见问题

1. **AI无法回复**
   - 检查OpenAI API密钥是否正确
   - 确认API配额充足
   - 查看n8n执行日志

2. **项目信息获取失败**
   - 检查Supabase凭据配置
   - 确认项目ID存在
   - 验证数据库权限

3. **网络连接问题**
   - 检查webhook URL是否正确
   - 确认n8n工作流已激活
   - 测试网络连接

### 调试模式

在 `.env` 文件中设置：

```bash
VITE_AI_CHAT_DEBUG=true
```

这将在浏览器控制台输出详细的调试信息。

## 扩展功能

### 添加更多上下文

可以修改工作流，添加更多Supabase查询节点来获取：
- 项目任务列表
- 团队成员信息
- 项目进度统计

### 自定义AI提示

在工作流的OpenAI节点中修改system message：

```
你是一个专业的项目管理助手。
当前项目：{{ 项目名称 }}
项目描述：{{ 项目描述 }}
请基于项目信息提供专业建议。
```

### 添加聊天历史

可以在工作流中添加Supabase插入节点来保存聊天记录。

## 文件结构

```
├── scripts/
│   └── setup-simple-ai-chat.js     # 自动化设置脚本
├── src/
│   ├── api/
│   │   └── simple-ai-chat.ts       # AI聊天API
│   └── components/
│       └── SimpleAIChat.vue        # 聊天组件
├── n8n_workflows/
│   └── simple-ai-chat-workflow.json # n8n工作流配置
├── .env.example                     # 环境配置示例
└── SIMPLE_AI_CHAT_SETUP.md        # 本文档
```

## 支持

如果遇到问题：

1. 检查n8n执行日志
2. 验证所有凭据配置
3. 确认环境变量设置
4. 查看浏览器控制台错误

---

*最后更新: 2025-01-16*
*版本: 简化版 v1.0*