import { NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase';
import { getMemberFromRequest } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const { channel_slug, body, parent_id } = await req.json();

  if (!channel_slug || !body?.trim()) {
    return NextResponse.json({ error: 'Missing channel_slug or body' }, { status: 400 });
  }

  const sender = await getMemberFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: channel } = await serviceClient
    .from('channels')
    .select('id')
    .eq('slug', channel_slug)
    .single();

  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

  const { data, error } = await serviceClient
    .from('messages')
    .insert({
      channel_id: channel.id,
      sender_id: sender.id,
      body: body.trim(),
      parent_id: parent_id ?? null,
    })
    .select('id, body, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message: data });
}

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
