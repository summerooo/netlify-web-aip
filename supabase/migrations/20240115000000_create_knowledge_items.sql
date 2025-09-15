-- 创建知识库项目表
CREATE TABLE IF NOT EXISTS knowledge_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    type TEXT NOT NULL CHECK (type IN ('document', 'link', 'note')),
    url TEXT,
    tags JSONB,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_knowledge_items_project_id ON knowledge_items(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_created_by ON knowledge_items(created_by);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_type ON knowledge_items(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_created_at ON knowledge_items(created_at DESC);

-- 启用 RLS
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- 用户可以查看所属项目的知识库项目
CREATE POLICY "Users can view knowledge items of their projects" ON knowledge_items
    FOR SELECT USING (
        project_id IN (
            SELECT project_id 
            FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

-- 用户可以在所属项目中创建知识库项目
CREATE POLICY "Users can create knowledge items in their projects" ON knowledge_items
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT project_id 
            FROM project_members 
            WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- 用户可以更新自己创建的知识库项目
CREATE POLICY "Users can update their own knowledge items" ON knowledge_items
    FOR UPDATE USING (
        created_by = auth.uid()
        AND project_id IN (
            SELECT project_id 
            FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

-- 用户可以删除自己创建的知识库项目，或者项目管理员可以删除项目内的知识库项目
CREATE POLICY "Users can delete knowledge items" ON knowledge_items
    FOR DELETE USING (
        created_by = auth.uid()
        OR project_id IN (
            SELECT project_id 
            FROM project_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_knowledge_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_items_updated_at
    BEFORE UPDATE ON knowledge_items
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_items_updated_at();