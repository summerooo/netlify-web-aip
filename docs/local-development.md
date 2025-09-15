# 开发环境配置指南

## 📋 环境要求

- Node.js 18+ 
- npm 或 yarn
- Git
- Supabase 账号 (推荐) 或 Docker (本地环境)

## 🚀 快速开始

### 1. 项目初始化

```bash
# 克隆项目
git clone <项目地址>
cd aip-project

# 安装依赖
npm install
```

## 🌐 方式一：使用 Supabase 云服务 (推荐)

### 1. 创建 Supabase 项目

1. 访问 [Supabase 官网](https://supabase.com)
2. 注册/登录账号
3. 点击 "New Project" 创建新项目
4. 选择组织和填写项目信息：
   - **Name**: aip-project (或您喜欢的名称)
   - **Database Password**: 设置一个强密码
   - **Region**: 选择离您最近的区域 (如 Northeast Asia - ap-northeast-1)

### 2. 获取项目配置

项目创建完成后：

1. 进入项目 Dashboard
2. 点击左侧菜单的 "Settings" → "API"
3. 复制以下信息：
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入您的 Supabase 配置：

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. 初始化数据库

1. 在 Supabase Dashboard 中，点击左侧菜单的 "SQL Editor"
2. 点击 "New query"
3. 复制 `supabase/seed.sql` 文件的内容并粘贴到编辑器中
4. 点击 "Run" 执行 SQL 脚本

这将创建所有必要的表、策略和初始数据。

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 开始使用应用！

### 6. 验证配置

1. 尝试注册新用户
2. 登录系统
3. 创建组织和项目
4. 在 Supabase Dashboard 的 "Table Editor" 中查看数据是否正确保存

## 🔧 方式二：使用 Supabase 本地环境

如果您更喜欢完全本地的开发环境：

### 1. 安装 Docker

确保您的系统已安装 Docker Desktop。

### 2. Supabase 本地环境设置

#### 安装 Supabase CLI

**macOS (推荐使用 Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Windows (使用 Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**通用方法 (npm):**
```bash
npm install -g supabase
```

#### 启动本地 Supabase

```bash
# 在项目根目录执行
supabase start
```

首次启动会下载 Docker 镜像，可能需要几分钟时间。

#### 获取本地配置信息

启动成功后，终端会显示类似以下信息：

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### 3. 环境变量配置

创建 `.env` 文件并配置本地 Supabase 信息：

```bash
# 复制示例文件
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 本地 Supabase 配置
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

### 4. 数据库初始化

```bash
# 重置数据库并运行迁移
supabase db reset
```

这会：
- 清空现有数据
- 运行 `supabase/seed.sql` 中的初始化脚本
- 创建所有表和策略

### 5. 启动前端开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

## 🛠️ 开发工具

### Supabase Studio (数据库管理)

访问 http://localhost:54323 打开 Supabase Studio，您可以：

- 查看和编辑数据表
- 运行 SQL 查询
- 管理用户认证
- 查看实时订阅
- 测试 Edge Functions

### 邮件测试 (Inbucket)

访问 http://localhost:54324 查看测试邮件，用于：

- 用户注册确认邮件
- 密码重置邮件
- 邀请邮件

## 📝 常用命令

### Supabase 命令

```bash
# 查看服务状态
supabase status

# 启动服务
supabase start

# 停止服务
supabase stop

# 重启服务
supabase restart

# 重置数据库
supabase db reset

# 查看数据库差异
supabase db diff

# 生成迁移文件
supabase db diff --file migration_name

# 推送本地更改到远程
supabase db push

# 拉取远程更改到本地
supabase db pull
```

### 前端开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 类型检查
npm run type-check
```

## 🔧 故障排除

### 常见问题

**1. Docker 相关错误**
```bash
# 确保 Docker 正在运行
docker --version

# 清理 Docker 容器和镜像
supabase stop
docker system prune -a
supabase start
```

**2. 端口冲突**
```bash
# 检查端口占用
lsof -i :54321
lsof -i :54322
lsof -i :54323

# 停止占用端口的进程或修改 supabase/config.toml 中的端口配置
```

**3. 数据库连接问题**
```bash
# 重置数据库
supabase db reset

# 检查数据库状态
supabase status
```

**4. 前端连接问题**
- 确保 `.env` 文件中的 URL 和 Key 正确
- 检查 Supabase 服务是否正常运行
- 查看浏览器控制台错误信息

### 日志查看

```bash
# 查看 Supabase 日志
supabase logs

# 查看特定服务日志
supabase logs --service postgres
supabase logs --service auth
supabase logs --service rest
```

## 🚀 生产环境部署

### 创建 Supabase 项目

1. 访问 https://supabase.com
2. 创建新项目
3. 获取项目 URL 和 API Key

### 部署数据库架构

```bash
# 链接到远程项目
supabase link --project-ref your-project-ref

# 推送本地架构到远程
supabase db push
```

### 部署 Edge Functions

```bash
# 部署所有函数
supabase functions deploy

# 部署特定函数
supabase functions deploy ai-chat
```

### 更新生产环境变量

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

## 📚 相关文档

- [Supabase 官方文档](https://supabase.com/docs)
- [Vue 3 文档](https://vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)
- [Vite 文档](https://vitejs.dev/)

## 🤝 开发规范

### Git 工作流

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 提交更改
git add .
git commit -m "feat: add your feature description"

# 推送分支
git push origin feature/your-feature-name
```

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 Vue 3 Composition API 规范
- API 调用统一放在 `src/api/` 目录下
- 组件按功能模块组织

### 数据库迁移

```bash
# 修改数据库后生成迁移文件
supabase db diff --file add_new_table

# 应用迁移
supabase db reset
```

这样可以确保团队成员之间的数据库架构保持同步。