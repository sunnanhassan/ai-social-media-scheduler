import { NextResponse } from 'next/server';
import { getInsforgeServerClient } from '@/lib/insforge-server';

export async function GET() {
  try {
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Since idea_groups is global and we use admin client, we fetch all groups
    let { data: groups, error: groupsError } = await insforge
      .database.from('idea_groups')
      .select('*')
      .order('sort_order', { ascending: true });

    if (groupsError) throw groupsError;

    // Automatically seed default groups if table is empty
    if (!groups || groups.length === 0) {
      const defaultGroups = [
        { name: 'Backlog', sort_order: 1000 },
        { name: 'In Progress', sort_order: 2000 },
        { name: 'Done', sort_order: 3000 },
      ];
      const { data: seeded, error: seedError } = await insforge
        .database.from('idea_groups')
        .insert(defaultGroups)
        .select('*')
        .order('sort_order', { ascending: true });
      if (!seedError && seeded) {
        groups = seeded;
      }
    }

    // Fetch ideas only for the current user
    const { data: ideas, error: ideasError } = await insforge
      .database.from('ideas')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (ideasError) throw ideasError;

    // Stitch together and map to frontend camelCase expectations
    const groupedIdeas = (groups || []).map(group => ({
      id: group.id,
      title: group.name,
      ideas: (ideas || [])
        .filter(idea => idea.group_id === group.id)
        .map(idea => ({
          ...idea,
          columnId: idea.group_id,
          sortOrder: idea.sort_order,
          images: Array.isArray(idea.images) ? idea.images : []
        })),
    }));

    return NextResponse.json({ groups: groupedIdeas });
  } catch (error: any) {
    console.error('[GET /api/ideas]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { groupId, content, title, description, images } = body;
    const ideaTitle = title || content;

    if (!groupId || !ideaTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get max sort_order for the group to append at the end
    const { data: existingIdeas, error: fetchError } = await insforge
      .database.from('ideas')
      .select('sort_order')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    const nextSortOrder = existingIdeas && existingIdeas.length > 0 
      ? (existingIdeas[0].sort_order || 0) + 1000 
      : 1000;

    const { data, error } = await insforge
      .database.from('ideas')
      .insert({
        user_id: userId,
        group_id: groupId,
        title: ideaTitle,
        description: description || null,
        images: Array.isArray(images) ? images : [],
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[POST /api/ideas]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 });
    }

    // Validate ownership before updating (since we use admin client)
    const { data: existingIdea, error: checkError } = await insforge
      .database.from('ideas')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError || !existingIdea || existingIdea.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
    }

    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.groupId !== undefined) dbUpdates.group_id = updates.groupId;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
    if (updates.content !== undefined) dbUpdates.title = updates.content;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.images !== undefined) dbUpdates.images = updates.images;

    const { data, error } = await insforge
      .database.from('ideas')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PATCH /api/ideas]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Validate ownership
    const { data: existingIdea, error: checkError } = await insforge
      .database.from('ideas')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError || !existingIdea || existingIdea.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
    }

    const { error } = await insforge
      .database.from('ideas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/ideas]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
