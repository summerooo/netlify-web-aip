# AI项目助手聊天功能

## 功能概述

AI项目助手是一个集成在项目详情页面的智能聊天功能，能够基于当前项目的实时数据为用户提供项目分析、风险识别、任务管理建议等服务。

## 功能特性

### 🤖 智能对话
- 基于项目实时数据的上下文理解
- 支持多轮对话和历史记录
- 智能识别用户意图并提供相应建议

### 📊 项目分析
- **进度分析**：实时计算项目完成度和进展情况
- **风险识别**：基于任务分配和进度识别潜在风险
- **团队管理**：分析团队成员工作负载和分配情况
- **任务优化**：提供任务分配和优先级建议

### 💬 用户体验
- 现代化的聊天界面设计
- 实时打字指示器
- 快捷键支持（Ctrl + Enter发送）
- 响应式设计，支持移动端

## 技术架构

### 前端组件
- **Vue 3 + TypeScript**：主要开发框架
- **Element Plus**：UI组件库
- **响应式设计**：适配各种屏幕尺寸

### 后端服务
- **n8n工作流**：处理AI聊天逻辑
- **Webhook API**：接收和响应聊天请求
- **两种实现方式**：
  - 简化版本：基于规则的智能回复
  - 完整版本：集成OpenAI GPT-3.5-turbo

## 文件结构

```
├── src/views/ProjectDetail.vue          # 主要前端组件
├── n8n_workflows/
│   ├── ai-project-chat-simple.json     # 简化版n8n工作流
│   └── ai-project-chat-workflow.json   # 完整版n8n工作流
├── docs/
│   ├── n8n-ai-chat-deployment.md       # 部署指南
│   └── AI-Chat-Feature.md              # 功能说明（本文件）
└── scripts/
    └── test-ai-chat.js                  # 测试脚本
```

## 快速开始

### 1. 部署n8n工作流

```bash
# 安装并启动n8n
npm install n8n -g
n8n start

# 访问 http://localhost:5678
# 导入 n8n_workflows/ai-project-chat-simple.json
# 激活工作流
```

### 2. 前端配置

前端代码已经集成在 `src/views/ProjectDetail.vue` 中，包含：
- AI聊天对话框UI
- 消息发送和接收逻辑
- 项目上下文数据收集
- 错误处理和用户反馈

### 3. 测试功能

```bash
# 运行测试脚本
node scripts/test-ai-chat.js

# 或指定自定义URL
node scripts/test-ai-chat.js --url http://your-server:5678/webhook/ai-project-chat
```

## 使用方法

### 在项目详情页面

1. 点击"AI 项目助手"卡片中的"开始对话"按钮
2. 在弹出的聊天对话框中输入问题
3. AI助手会基于当前项目数据提供智能回复

### 支持的问题类型

| 问题类型 | 示例问题 | 功能说明 |
|---------|---------|---------|
| 进度查询 | "当前项目进度如何？" | 分析项目完成度和任务状态 |
| 风险分析 | "项目有什么风险？" | 识别潜在风险并提供建议 |
| 团队管理 | "团队情况如何？" | 分析团队成员和工作负载 |
| 任务分配 | "任务分配情况？" | 优化任务分配建议 |
| 项目报告 | "生成项目报告" | 生成综合项目状态报告 |
| 通用咨询 | "你好" | 显示功能介绍和使用指南 |

## API接口

### 请求格式

```http
POST /webhook/ai-project-chat
Content-Type: application/json

{
  "message": "用户输入的问题",
  "projectContext": {
    "project": {
      "name": "项目名称",
      "description": "项目描述",
      "status": "项目状态",
      "totalTasks": 10,
      "completedTasks": 5,
      "inProgressTasks": 3,
      "totalMembers": 4
    },
    "tasks": [...],
    "members": [...],
    "recentActivities": [...]
  },
  "conversationHistory": [...]
}
```

### 响应格式

```json
{
  "success": true,
  "response": "AI助手的回复内容",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 核心功能实现

### 1. 项目上下文收集

```javascript
const projectContext = {
  project: {
    name: project.value?.name,
    description: project.value?.description,
    status: project.value?.status,
    totalTasks: projectStats.value.totalTasks,
    completedTasks: projectStats.value.completedTasks,
    inProgressTasks: projectStats.value.inProgressTasks,
    totalMembers: projectStats.value.totalMembers
  },
  // ... 其他上下文数据
}
```

### 2. 智能回复生成

简化版本使用基于规则的逻辑：

```javascript
if (message.includes('进度') || message.includes('状态')) {
  const completionRate = Math.round((projectContext.project.completedTasks / projectContext.project.totalTasks) * 100) || 0;
  aiResponse = `📊 **项目进度分析**\n\n当前项目完成率：${completionRate}%...`;
}
```

完整版本使用OpenAI API：

```javascript
const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: message }
];
// 调用OpenAI API生成回复
```

### 3. 用户界面组件

- **聊天消息列表**：显示对话历史
- **输入区域**：支持多行文本和快捷键
- **加载指示器**：显示AI思考状态
- **操作按钮**：清空历史、发送消息等

## 自定义和扩展

### 添加新的问题类型

1. 在n8n工作流的"AI Logic"节点中添加新的条件判断
2. 定义相应的回复模板
3. 更新测试脚本中的测试用例

### 集成其他AI服务

1. 修改n8n工作流，替换OpenAI节点
2. 调整API调用参数和响应处理
3. 更新凭据配置

### 自定义UI样式

修改 `src/views/ProjectDetail.vue` 中的CSS样式：

```css
.ai-chat-dialog {
  /* 自定义对话框样式 */
}

.chat-message {
  /* 自定义消息样式 */
}
```

## 性能优化

### 前端优化
- 消息历史限制（最多保留50条）
- 防抖处理用户输入
- 虚拟滚动（大量消息时）

### 后端优化
- 请求缓存机制
- 并发请求限制
- 响应时间监控

## 安全考虑

### 数据安全
- 项目数据仅在请求时传输，不持久化存储
- 敏感信息过滤（如密码、密钥等）
- 用户输入验证和清理

### API安全
- 请求频率限制
- 输入长度限制
- 错误信息脱敏

## 监控和日志

### 前端监控
- 用户交互事件跟踪
- 错误日志收集
- 性能指标监控

### 后端监控
- n8n工作流执行日志
- API响应时间统计
- 错误率监控

## 故障排除

### 常见问题

1. **聊天功能无响应**
   - 检查n8n服务状态
   - 验证webhook URL配置
   - 查看浏览器控制台错误

2. **AI回复质量差**
   - 检查项目上下文数据完整性
   - 优化提示词模板
   - 考虑升级到完整版本

3. **响应时间过长**
   - 检查网络连接
   - 优化n8n工作流逻辑
   - 考虑添加缓存机制

### 调试方法

```bash
# 查看n8n执行日志
# 在n8n界面中点击 "Executions" 查看详细日志

# 测试API连接
curl -X POST http://localhost:5678/webhook/ai-project-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"测试","projectContext":{"project":{"name":"测试项目"}}}'

# 运行完整测试套件
node scripts/test-ai-chat.js
```

## 未来规划

### 短期目标
- [ ] 添加语音输入支持
- [ ] 实现消息搜索功能
- [ ] 支持文件上传和分析
- [ ] 添加快捷回复模板

### 长期目标
- [ ] 多语言支持
- [ ] 集成更多AI模型
- [ ] 个性化学习能力
- [ ] 移动端原生应用

## 贡献指南

欢迎贡献代码和建议！请遵循以下步骤：

1. Fork项目仓库
2. 创建功能分支
3. 提交代码更改
4. 运行测试确保功能正常
5. 提交Pull Request

## 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues：[GitHub Issues](https://github.com/your-repo/issues)
- 邮箱：your-email@example.com
- 文档：[项目文档](https://your-docs-site.com)

---

*最后更新：2024年1月*