# Supabase 云服务配置指南

## 🌐 使用 Supabase 云服务进行开发

这是推荐的开发方式，无需本地安装 Docker 或 Supabase CLI，直接使用 Supabase 官方云服务。

## 📝 步骤详解

### 1. 创建 Supabase 账号和项目

#### 注册账号
1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project" 或 "Sign up"
3. 使用 GitHub、Google 或邮箱注册

#### 创建新项目
1. 登录后点击 "New Project"
2. 选择或创建组织 (Organization)
3. 填写项目信息：
   - **Name**: `aip-project` (或您喜欢的名称)
   - **Database Password**: 设置强密码 (请记住此密码)
   - **Region**: 选择 `Northeast Asia (ap-northeast-1)` 或离您最近的区域
4. 点击 "Create new project"

### 2. 获取项目配置信息

项目创建完成后 (通常需要1-2分钟)：

1. 进入项目 Dashboard
2. 在左侧菜单中点击 "Settings" → "API"
3. 在 "Project API keys" 部分找到：
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (保密，不要暴露)

### 3. 配置本地环境变量

在项目根目录创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入您的配置：

```env
# Supabase 云服务配置
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key

# 可选：如果需要使用 service_role (仅用于服务端)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. 初始化数据库架构

#### 方法一：使用 SQL Editor (推荐)

1. 在 Supabase Dashboard 中，点击左侧菜单的 "SQL Editor"

2. **第一步：创建表结构**
   - 点击 "New query" 创建新查询
   - 复制项目中 `supabase/seed.sql` 文件的全部内容
   - 粘贴到 SQL Editor 中
   - 点击 "Run" 按钮执行

3. **第二步：修复RLS策略** (重要！)
   - 再次点击 "New query" 创建新查询
   - 复制项目中 `supabase/ultimate-fix-policies.sql` 文件的全部内容
   - 粘贴到 SQL Editor 中
   - 点击 "Run" 按钮执行

> ⚠️ **重要提示**: 如果遇到 "infinite recursion detected" 错误，请使用 `ultimate-fix-policies.sql` 进行终极修复。这个脚本会完全重建所有策略，彻底解决循环引用问题。

#### 方法二：使用 Supabase CLI (可选)

如果您安装了 Supabase CLI：

```bash
# 安装 CLI
npm install -g supabase

# 登录
supabase login

# 链接到您的项目
supabase link --project-ref your-project-ref

# 推送数据库架构
supabase db push
```

### 5. 验证数据库设置

执行 SQL 后，检查以下表是否创建成功：

1. 在 Dashboard 中点击 "Table Editor"
2. 确认以下表存在：
   - `users` (用户表)
   - `organizations` (组织表)
   - `organization_members` (组织成员表)
   - `projects` (项目表)
   - `project_members` (项目成员表)
   - `tasks` (任务表)
   - `documents` (文档表)

### 6. 配置认证设置

1. 在 Dashboard 中点击 "Authentication" → "Settings"
2. 在 "Site URL" 中添加：`http://localhost:5173`
3. 在 "Redirect URLs" 中添加：`http://localhost:5173/**`
4. 保存设置

### 7. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 开始使用！

## 🧪 测试应用功能

### 注册新用户
1. 访问注册页面
2. 填写邮箱和密码
3. 检查 Supabase Dashboard 的 "Authentication" → "Users" 中是否出现新用户

### 创建组织
1. 登录后在组织页面创建新组织
2. 在 "Table Editor" → "organizations" 中查看数据

### 创建项目
1. 在组织详情页创建项目
2. 在 "Table Editor" → "projects" 中查看数据

## 🔧 常用操作

### 查看实时数据
- **用户管理**: Authentication → Users
- **数据表**: Table Editor
- **API 日志**: Logs → API
- **实时订阅**: Database → Replication

### 重置数据库
如果需要清空所有数据并重新初始化：

1. 在 SQL Editor 中运行：
```sql
-- 删除所有数据 (保留表结构)
TRUNCATE TABLE tasks, project_members, projects, organization_members, organizations RESTART IDENTITY CASCADE;

-- 或者重新运行完整的 seed.sql
```

### 备份数据
1. 在 Settings → Database 中
2. 点击 "Database backups"
3. 可以创建手动备份或查看自动备份

## 🚀 部署到生产环境

当您准备部署时：

1. **前端部署** (Vercel/Netlify):
   - 设置环境变量为相同的 Supabase 配置
   - 更新 Supabase 的 Site URL 为生产域名

2. **域名配置**:
   - 在 Supabase Settings → API 中更新 Site URL
   - 添加生产域名到 Redirect URLs

3. **安全设置**:
   - 启用 RLS (Row Level Security)
   - 检查所有安全策略
   - 限制 API 访问权限

## 💡 开发技巧

### 实时调试
- 使用 Supabase Dashboard 的 "Logs" 查看 API 调用
- 在 "SQL Editor" 中测试查询
- 使用浏览器开发者工具查看网络请求

### 数据库设计
- 在 "Table Editor" 中可视化编辑表结构
- 使用 "Database" → "Schema Visualizer" 查看表关系
- 在 SQL Editor 中运行复杂查询

### 性能优化
- 在 "Database" → "Indexes" 中查看和创建索引
- 使用 "Logs" → "Postgres Logs" 监控慢查询
- 在 API 设置中配置缓存

## ❓ 常见问题

### 连接问题
- 检查 `.env` 文件中的 URL 和 Key 是否正确
- 确认 Supabase 项目状态正常 (Dashboard 显示绿色)
- 检查网络连接和防火墙设置

### 认证问题
- 确认 Site URL 配置正确
- 检查邮箱确认设置 (如果启用)
- 查看 Authentication → Settings 中的配置

### 数据库问题
- 在 SQL Editor 中测试查询
- 检查 RLS 策略是否正确
- 查看 Postgres Logs 了解错误详情

## 📞 获取帮助

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Discord 社区](https://discord.supabase.com/)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

使用云服务的优势是简单、稳定，无需维护本地环境，非常适合快速开发和原型验证！