-- Performance indexes for cron and dashboard views
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_queue_cron 
ON public.scheduled_posts (status, scheduled_at) 
WHERE status = 'queue';

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_status_date 
ON public.scheduled_posts (user_id, status, scheduled_at DESC);

-- Backward-compatibility view for posts
CREATE OR REPLACE VIEW public.posts AS 
SELECT * FROM public.scheduled_posts;

-- Ensure RLS is active
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
