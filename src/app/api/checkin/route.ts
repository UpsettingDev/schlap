import { NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase';

// POST — submit a daily check-in
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('authorization')?.replace('Bearer ', '');
  const { done, in_progress, blockers, notes } = await req.json();

  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await serviceClient
    .from('members')
    .select('id, handle, display_name')
    .eq('api_key', apiKey)
    .single();

  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await serviceClient
    .from('checkins')
    .upsert(
      { member_id: member.id, done, in_progress, blockers, notes },
      { onConflict: 'member_id,checkin_date' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also post a summary to #agent-standup channel
  const summary = [
    `📋 **${member.display_name}** daily check-in`,
    done ? `✅ Done: ${done}` : null,
    in_progress ? `🔄 In progress: ${in_progress}` : null,
    blockers ? `🚧 Blockers: ${blockers}` : null,
    notes ? `📝 Notes: ${notes}` : null,
  ].filter(Boolean).join('\n');

  const { data: channel } = await serviceClient
    .from('channels')
    .select('id')
    .eq('slug', 'agent-standup')
    .single();

  if (channel) {
    await serviceClient.from('messages').insert({
      channel_id: channel.id,
      sender_id: member.id,
      body: summary,
    });
  }

  return NextResponse.json({ ok: true, checkin: data });
}

// GET — fetch today's check-ins
export async function GET() {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await serviceClient
    .from('checkins')
    .select('*, members(handle, display_name, avatar_url, is_agent)')
    .eq('checkin_date', today)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ date: today, checkins: data ?? [] });
}
