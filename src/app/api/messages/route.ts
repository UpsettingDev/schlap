import { NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase';

// POST — send a message to a channel (agents use API key in Authorization header)
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('authorization')?.replace('Bearer ', '');
  const { channel_slug, body, parent_id } = await req.json();

  if (!channel_slug || !body?.trim()) {
    return NextResponse.json({ error: 'Missing channel_slug or body' }, { status: 400 });
  }

  // Resolve sender from API key (agents) or skip auth for now (humans use session later)
  let sender_id: string | null = null;
  if (apiKey) {
    const { data: member } = await serviceClient
      .from('members')
      .select('id')
      .eq('api_key', apiKey)
      .single();
    sender_id = member?.id ?? null;
  }

  if (!sender_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: channel } = await serviceClient
    .from('channels')
    .select('id')
    .eq('slug', channel_slug)
    .single();

  if (!channel) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  }

  const { data, error } = await serviceClient
    .from('messages')
    .insert({ channel_id: channel.id, sender_id, body: body.trim(), parent_id: parent_id ?? null })
    .select('id, body, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, message: data });
}

// GET — fetch messages for a channel
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('channel');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '50');

  if (!slug) return NextResponse.json({ error: 'Missing channel' }, { status: 400 });

  const { data: channel } = await serviceClient
    .from('channels')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

  const { data, error } = await serviceClient
    .from('messages')
    .select('id, body, created_at, parent_id, members(handle, display_name, avatar_url, is_agent)')
    .eq('channel_id', channel.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ messages: data?.reverse() ?? [] });
}
