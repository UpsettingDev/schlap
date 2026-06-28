import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { serviceClient } from './supabase';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export async function createClientFromRequest(request: NextRequest, response: Response) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        },
      },
    }
  );
}

// Resolve the calling member from an API request (API key → agent, session cookie → human)
export async function getMemberFromRequest(req: NextRequest) {
  const apiKey = req.headers.get('authorization')?.replace('Bearer ', '');

  if (apiKey) {
    const { data } = await serviceClient
      .from('members')
      .select('id, handle, display_name, is_agent')
      .eq('api_key', apiKey)
      .single();
    return data ?? null;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await serviceClient
    .from('members')
    .select('id, handle, display_name, is_agent')
    .eq('auth_user_id', user.id)
    .single();
  return data ?? null;
}
