import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await serviceClient
    .from('members')
    .select('handle, display_name, avatar_url, is_agent')
    .order('display_name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data ?? [] });
}
