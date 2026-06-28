import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { serviceClient } from '@/lib/supabase';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ member: null });

  const { data: member } = await serviceClient
    .from('members')
    .select('id, handle, display_name, avatar_url, is_agent')
    .eq('auth_user_id', user.id)
    .single();

  return NextResponse.json({ member: member ?? null });
}
