# AIP - AI项目管理平台

🤖 一个革命性的AI驱动项目管理平台，通过三级AI智能体深度参与项目管理全流程，实现智能化协作。

## ✨ 核心特性

- **智能化决策支持** - AI提供数据驱动的项目决策建议
- **自动化任务管理** - 减少重复性工作，提高团队效率
- **知识沉淀与共享** - 构建组织级知识库，避免经验流失
- **实时风险预警** - 提前识别项目风险，主动干预

## 🏗️ 技术架构

- **前端**: Vue 3 + TypeScript + Element Plus + Vite
- **后端**: Supabase (PostgreSQL + 实时订阅 + 认证)
- **AI编排**: Supabase Edge Functions + 大语言模型 API
- **部署**: 本地开发 / Netlify + Supabase

## 🚀 快速开始

> 📖 **配置指南**: 
> - [Supabase 云服务配置](./docs/supabase-cloud-setup.md) (推荐)
> - [本地开发环境配置](./docs/local-development.md) (完整本地环境)
> - [快速测试指南](./docs/quick-test-guide.md) (解决空数据问题)

### 环境要求

- Node.js 18+
- npm 或 yarn
- Docker (用于 Supabase 本地环境)
- Supabase CLI

### 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入您的 Supabase 项目配置

# 3. 启动前端开发服务器
npm run dev
```

### 环境配置

#### 方式一：使用 Supabase 云服务 (推荐)

1. 访问 [Supabase 官网](https://supabase.com) 创建项目
2. 在项目设置中获取 URL 和 API Key
3. 配置 `.env` 文件：

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. 在 Supabase Dashboard 的 SQL Editor 中运行数据库初始化脚本：
   - 首先运行 `supabase/seed.sql` 来创建表结构
   - 然后运行 `supabase/ultimate-fix-policies.sql` 来彻底修复RLS策略循环引用问题

#### 方式二：使用本地 Supabase 环境

如果您想使用本地开发环境，请参考 [本地开发配置指南](./docs/local-development.md)

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

### 启动 Supabase 本地开发环境

#### 1. 安装 Supabase CLI
```bash
# 使用 npm 安装
npm install -g supabase

# 或使用 Homebrew (macOS)
brew install supabase/tap/supabase

# 或使用 Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### 2. 初始化和启动本地 Supabase
```bash
# 在项目根目录下初始化 Supabase (如果还没初始化)
supabase init

# 启动本地 Supabase 服务
supabase start

# 或者使用 npm 脚本
npm run supabase
```

#### 3. 本地 Supabase 配置信息
启动成功后，您会看到类似以下的输出：

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 4. 更新环境变量
将本地 Supabase 的配置信息更新到 `.env` 文件：

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 5. 运行数据库迁移
```bash
# 应用数据库架构
supabase db reset

# 或者推送本地更改到数据库
supabase db push
```

#### 6. 访问 Supabase Studio
打开浏览器访问 http://localhost:54323 来管理本地数据库。

### 启动前端开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

## 🔧 本地开发完整流程

### 第一次设置

1. **克隆项目并安装依赖**
```bash
git clone <项目地址>
cd aip-project
npm install
```

2. **安装 Supabase CLI**
```bash
npm install -g supabase
```

3. **启动 Supabase 本地服务**
```bash
supabase start
```

4. **配置环境变量**
复制启动后显示的本地配置到 `.env` 文件：
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=你的本地anon_key
```

5. **初始化数据库**
```bash
supabase db reset
```

6. **启动前端开发服务器**
```bash
npm run dev
```

### 日常开发流程

```bash
# 1. 启动 Supabase (如果还没启动)
supabase start

# 2. 启动前端开发服务器
npm run dev

# 3. 开始开发...

# 4. 停止服务 (开发完成后)
supabase stop
```

### 常用 Supabase 命令

```bash
# 查看服务状态
supabase status

# 重置数据库 (清空所有数据并重新运行迁移)
supabase db reset

# 查看数据库差异
supabase db diff

# 生成新的迁移文件
supabase db diff --file new_migration

# 停止所有服务
supabase stop
```

## 📁 项目结构

```
aip-project/
├── src/
│   ├── components/          # 可复用组件
│   ├── views/              # 页面组件
│   ├── stores/             # Pinia 状态管理
│   ├── router/             # Vue Router 配置
│   ├── lib/                # 工具库
│   └── style.css           # 全局样式
├── supabase/
│   ├── functions/          # Edge Functions
│   ├── config.toml         # Supabase 配置
│   └── seed.sql           # 数据库初始化脚本
├── package.json
└── README.md
```

## 🎯 核心功能

### 用户认证
- 邮箱密码注册/登录
- 邮箱验证
- 密码重置

### 组织管理
- 创建和管理组织
- 成员邀请和权限管理
- 组织设置

### 项目管理
- 项目创建和配置
- 项目状态跟踪
- 团队协作

### 任务管理
- 看板式任务管理
- 任务分配和状态更新
- 优先级设置

### AI智能助手
- 基于上下文的智能对话
- 项目分析和建议
- 风险识别和预警

## 🔧 开发指南

### 数据库架构

项目使用 Supabase PostgreSQL 数据库，主要表结构：

- `user_profiles` - 用户配置文件
- `organizations` - 组织信息
- `organization_members` - 组织成员关系
- `projects` - 项目信息
- `project_members` - 项目成员关系
- `tasks` - 任务管理
- `chat_history` - AI对话历史
- `documents` - 知识库文档
- `notifications` - 系统通知
- `invitations` - 邀请管理

### API 接口

项目使用 Supabase 自动生成的 REST API 和实时订阅功能。

### Edge Functions

- `ai-chat` - AI聊天功能，处理用户与AI的对话

### 状态管理

使用 Pinia 进行状态管理：

- `authStore` - 用户认证状态
- 其他业务状态根据需要添加

## 🔐 安全特性

- 行级安全策略 (RLS)
- JWT 身份验证
- API 权限控制
- 数据隔离

## 📊 性能优化

- 批量查询优化
- 并发数据获取
- 缓存策略
- 实时订阅优化

## 🚀 部署

### 前端部署 (Netlify)

1. 构建项目：
```bash
npm run build
```

2. 将 `dist` 目录部署到 Netlify

### 后端部署 (Supabase)

1. 创建 Supabase 项目
2. 运行数据库迁移：
```bash
supabase db push
```

3. 部署 Edge Functions：
```bash
npm run deploy
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 项目链接: [https://github.com/your-username/aip-project](https://github.com/your-username/aip-project)
- 问题反馈: [Issues](https://github.com/your-username/aip-project/issues)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**AIP - 让项目管理更智能** 🚀