# 快速测试指南

如果您遇到Dashboard显示空数据或500错误，很可能是因为数据库中还没有数据。以下是快速创建测试数据的方法：

## 🚀 方法一：通过应用界面创建数据 (推荐)

### 1. 注册并登录
1. 访问 http://localhost:5173
2. 点击"注册"创建新账号
3. 登录系统

### 2. 创建组织
1. 进入"组织管理"页面
2. 点击"创建组织"
3. 填写组织信息：
   - **名称**: 示例科技公司
   - **描述**: 一个专注于AI技术的创新公司
4. 点击"创建"

### 3. 创建项目
1. 点击刚创建的组织进入详情页
2. 在"项目管理"标签页中点击"创建项目"
3. 填写项目信息：
   - **名称**: AI聊天机器人
   - **描述**: 基于大语言模型的智能对话系统
   - **状态**: 进行中
4. 点击"创建"

### 4. 查看Dashboard
返回Dashboard页面，现在应该能看到：
- 组织数量: 1
- 项目数量: 1
- 最近项目列表

## 🛠️ 方法二：通过SQL直接插入数据

如果您更喜欢直接操作数据库：

### 1. 获取用户ID
在Supabase Dashboard中：
1. 进入 Authentication → Users
2. 复制您的用户ID (UUID格式)

### 2. 运行SQL插入数据
在SQL Editor中运行以下SQL (请替换 `your-user-id`):

```sql
-- 插入测试组织
INSERT INTO public.organizations (id, name, description, created_by) VALUES
(gen_random_uuid(), '示例科技公司', '一个专注于AI技术的创新公司', 'your-user-id');

-- 获取组织ID
SELECT id, name FROM public.organizations WHERE created_by = 'your-user-id';

-- 插入组织成员关系 (请替换 organization-id)
INSERT INTO public.organization_members (organization_id, user_id, role) VALUES
('organization-id', 'your-user-id', 'admin');

-- 插入测试项目 (请替换 organization-id)
INSERT INTO public.projects (id, name, description, status, organization_id, created_by) VALUES
(gen_random_uuid(), 'AI聊天机器人', '基于大语言模型的智能对话系统', '进行中', 'organization-id', 'your-user-id');
```

## 🔍 故障排除

### 常见问题

**1. Dashboard显示全部为0**
- 检查是否已创建组织和项目
- 确认用户已加入组织 (organization_members表)

**2. 500错误**
- 检查RLS策略是否正确配置
- 运行 `supabase/complete-fix-policies.sql`
- 查看Supabase Dashboard的Logs了解具体错误

**3. 权限错误**
- 确认RLS策略允许用户访问数据
- 检查用户是否为组织成员

### 检查数据的SQL查询

```sql
-- 检查当前用户的组织
SELECT o.*, om.role 
FROM organizations o 
JOIN organization_members om ON o.id = om.organization_id 
WHERE om.user_id = auth.uid();

-- 检查当前用户的项目
SELECT p.* 
FROM projects p 
JOIN organization_members om ON p.organization_id = om.organization_id 
WHERE om.user_id = auth.uid();

-- 检查当前用户ID
SELECT auth.uid() as current_user_id;
```

## 📊 验证数据

创建数据后，Dashboard应该显示：
- ✅ 组织数量 > 0
- ✅ 项目数量 > 0  
- ✅ 最近项目列表有内容
- ✅ 没有500错误

如果仍有问题，请检查浏览器控制台的错误信息，或查看Supabase Dashboard的实时日志。