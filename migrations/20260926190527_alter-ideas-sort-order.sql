-- Alter ideas table to use DOUBLE PRECISION for sort_order for drag and drop
ALTER TABLE public.ideas ALTER COLUMN sort_order TYPE DOUBLE PRECISION;

-- Add sort_order to idea_groups
ALTER TABLE public.idea_groups ADD COLUMN sort_order DOUBLE PRECISION DEFAULT 0;

-- Set initial sort_order for idea_groups
UPDATE public.idea_groups SET sort_order = 1000 WHERE name = 'Unassigned';
UPDATE public.idea_groups SET sort_order = 2000 WHERE name = 'To Do';
UPDATE public.idea_groups SET sort_order = 3000 WHERE name = 'In Progress';
UPDATE public.idea_groups SET sort_order = 4000 WHERE name = 'Done';
