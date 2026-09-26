-- Seed connected user_channels for user_demo_101
insert into user_channels (user_id, channel_type_id, handle, profile_image, profile_url, is_connected, is_active)
select 
  'user_demo_101', 
  id, 
  case when type = 'TWITTER' then '@sunnanhassan' else 'Sunnan Hassan' end,
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
  case when type = 'TWITTER' then 'https://x.com/sunnanhassan' else 'https://linkedin.com/in/sunnanhassan' end,
  true,
  true
from channel_types 
where type in ('TWITTER', 'LINKEDIN')
on conflict (user_id, channel_type_id) do update 
set is_connected = true, is_active = true;

-- Seed sample ideas for user_demo_101
insert into ideas (user_id, group_id, title, description, images, sort_order)
select 
  'user_demo_101',
  g.id,
  'Product Launch Announcement',
  'Thread breaking down the core value proposition, AI scheduler features, and early access discount.',
  '[{"url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80", "path": "mock/launch.png"}]'::jsonb,
  0
from idea_groups g where g.name = 'To Do'
limit 1;

insert into ideas (user_id, group_id, title, description, images, sort_order)
select 
  'user_demo_101',
  g.id,
  '5 Lessons from Building in Public',
  'Share lessons learned about multi-platform OAuth, rate-limiting queues, and design systems.',
  '[]'::jsonb,
  1
from idea_groups g where g.name = 'To Do'
limit 1;

insert into ideas (user_id, group_id, title, description, images, sort_order)
select 
  'user_demo_101',
  g.id,
  'Micro-SaaS Tech Stack Comparison',
  'Infographic comparing Next.js 16 App Router vs Vite SPA for SaaS applications.',
  '[{"url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80", "path": "mock/stats.png"}]'::jsonb,
  0
from idea_groups g where g.name = 'In Progress'
limit 1;

insert into ideas (user_id, group_id, title, description, images, sort_order)
select 
  'user_demo_101',
  g.id,
  'Weekly Growth Metric Roundup',
  'Recap our +240% engagement surge after shifting to automated timing optimization.',
  '[]'::jsonb,
  0
from idea_groups g where g.name = 'Done'
limit 1;

-- Seed scheduled posts for user_demo_101
insert into scheduled_posts (user_id, user_channel_id, content, images, scheduled_at, status)
select
  'user_demo_101',
  uc.id,
  '🚀 Excited to unveil our new AI-powered social media scheduling SaaS! Built with Next.js 16, Electric Mint & Charcoal styling, and multi-channel publishing.',
  '[{"url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80", "path": "mock/launch.png"}]'::jsonb,
  now() + interval '1 day',
  'draft'
from user_channels uc
where uc.user_id = 'user_demo_101'
limit 1;

insert into scheduled_posts (user_id, user_channel_id, content, images, scheduled_at, status)
select
  'user_demo_101',
  uc.id,
  'Content strategy in 2026 demands speed, aesthetic precision, and reliable AI assistance. We just rolled out intelligent copy generation and multi-channel synchronization.',
  '[]'::jsonb,
  now() + interval '2 days',
  'queue'
from user_channels uc
where uc.user_id = 'user_demo_101'
offset 1 limit 1;
