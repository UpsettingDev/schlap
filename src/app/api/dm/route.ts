import { NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase';
import { getMemberFromRequest } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const { to_handle, body } = await req.json();

  if (!to_handle || !body?.trim()) {
    return NextResponse.json({ error: 'Missing to_handle or body' }, { status: 400 });
  }

  const sender = await getMemberFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: recipient } = await serviceClient
    .from('members')
    .select('id')
    .eq('handle', to_handle)
    .single();

  if (!recipient) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });

  const { data, error } = await serviceClient
    .from('direct_messages')
    .insert({ from_id: sender.id, to_id: recipient.id, body: body.trim() })
    .select('id, body, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message: data });
}

export async function GET(req: NextRequest) {
  const with_handle = req.nextUrl.searchParams.get('with');
  if (!with_handle) return NextResponse.json({ error: 'Missing ?with=' }, { status: 400 });

  const me = await getMemberFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: other } = await serviceClient
    .from('members')
    .select('id')
    .eq('handle', with_handle)
    .single();

  if (!other) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  const { data, error } = await serviceClient
    .from('direct_messages')
    .select('id, body, created_at, from_id, sender:from_id(handle, display_name, is_agent)')
    .or(`and(from_id.eq.${me.id},to_id.eq.${other.id}),and(from_id.eq.${other.id},to_id.eq.${me.id})`)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}
