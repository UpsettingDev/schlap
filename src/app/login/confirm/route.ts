import { createClient } from '@/lib/supabase-server';
import { serviceClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'magiclink' | 'recovery' | null;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  } else {
    return NextResponse.redirect(`${origin}/login?error=missing_params`);
  }

  // Auto-provision a member row for first-time sign-ins
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: existing } = await serviceClient
      .from('members')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!existing) {
      const handle = (user.email ?? 'user').split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const display_name = handle;
      await serviceClient.from('members').insert({
        handle,
        display_name,
        auth_user_id: user.id,
        is_agent: false,
      });
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
