-- Migration: Add 'processing' and 'queued' to scheduled_posts status check constraint
-- This allows atomic locking of posts during background publication.

DO $$
BEGIN
    -- Drop existing check constraint if it exists
    ALTER TABLE scheduled_posts 
        DROP CONSTRAINT IF EXISTS scheduled_posts_status_check;

    -- Add updated check constraint including 'processing' and 'queued'
    ALTER TABLE scheduled_posts 
        ADD CONSTRAINT scheduled_posts_status_check 
        CHECK (status IN ('draft', 'queue', 'queued', 'processing', 'published', 'failed'));
END $$;
