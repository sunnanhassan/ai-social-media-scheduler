-- ====================================================================
-- MIGRATION: 003_workspaces_and_brands.sql
-- Enables multi-workspace/brand isolation with automatic default
-- ====================================================================

-- 1. Create Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  color       TEXT DEFAULT '#10B981',
  icon        TEXT DEFAULT 'sparkles',
  is_default  BOOLEAN DEFAULT false,
  ai_persona  JSONB DEFAULT '{"tone": "professional", "industry": "creator", "target_audience": "general"}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, slug)
);

-- RLS for Workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspaces_user_policy ON public.workspaces;
CREATE POLICY workspaces_user_policy ON public.workspaces
  FOR ALL USING (user_id = requesting_user_id())
  WITH CHECK (user_id = requesting_user_id());

CREATE INDEX IF NOT EXISTS idx_workspaces_user ON public.workspaces(user_id, is_default);

-- 2. Workspace Channels Mapping Table
CREATE TABLE IF NOT EXISTS public.workspace_channels (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_channel_id   UUID NOT NULL REFERENCES public.user_channels(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workspace_id, user_channel_id)
);

ALTER TABLE public.workspace_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspace_channels_user_policy ON public.workspace_channels;
CREATE POLICY workspace_channels_user_policy ON public.workspace_channels
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = requesting_user_id())
  );

CREATE INDEX IF NOT EXISTS idx_workspace_channels ON public.workspace_channels(workspace_id, user_channel_id);

-- 3. Add workspace_id to scheduled_posts and ideas
ALTER TABLE public.scheduled_posts 
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.ideas 
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_workspace ON public.scheduled_posts(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_ideas_workspace ON public.ideas(workspace_id);
