import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Defer createClient until first property access so this module evaluates
// cleanly at build time when env vars are not yet injected.
function lazy(getter: () => SupabaseClient): SupabaseClient {
  let instance: SupabaseClient | null = null;
  return new Proxy({} as SupabaseClient, {
    get(_, prop) {
      if (!instance) instance = getter();
      const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
      return typeof value === 'function' ? (value as Function).bind(instance) : value;
    },
  });
}

export const supabase = lazy(() =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
);

export const serviceClient = lazy(() =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
);
