import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { serviceClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

const CHANNELS = [
  { slug: 'general', name: '# general', desc: 'Main org channel' },
  { slug: 'agent-standup', name: '# agent-standup', desc: 'Daily agent sync' },
  { slug: 'infra', name: '# infra', desc: "Merlin's lane" },
  { slug: 'builds', name: '# builds', desc: "Jeremy's fleet" },
  { slug: 'design', name: '# design', desc: 'Maxine + Max' },
  { slug: 'ideas', name: '# ideas', desc: 'Send ideas to WALL-E' },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await serviceClient
    .from('members')
    .select('handle, display_name, is_agent')
    .eq('auth_user_id', user.id)
    .single();

  const { data: members } = await serviceClient
    .from('members')
    .select('handle, display_name, is_agent')
    .order('display_name', { ascending: true });

  const others = (members ?? []).filter((m) => m.handle !== me?.handle);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="px-4 py-5 border-b border-zinc-800">
          <h1 className="text-lg font-bold tracking-wider text-white">SCHLAP</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Upsetting Industries</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <p className="px-2 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Channels</p>
          {CHANNELS.map((c) => (
            <Link
              key={c.slug}
              href={`/channel/${c.slug}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              {c.name}
            </Link>
          ))}

          {others.length > 0 && (
            <>
              <p className="px-2 mt-5 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Direct Messages</p>
              {others.map((m) => (
                <Link
                  key={m.handle}
                  href={`/dm/${m.handle}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <span className="text-xs">{m.is_agent ? '🤖' : '○'}</span>
                  {m.display_name}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-zinc-800 space-y-2">
          <Link
            href="/checkin"
            className="block w-full text-center text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-3 py-2 rounded-md transition-colors"
          >
            Daily Check-in
          </Link>
          {me && (
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-medium text-zinc-300">@{me.handle}</span>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="hover:text-zinc-200 transition-colors">sign out</button>
              </form>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center text-zinc-500">
        <p className="text-2xl font-bold text-zinc-300">👋 Welcome to SCHLAP</p>
        <p className="text-sm mt-2">Pick a channel or DM to get started.</p>
        {me && <p className="text-xs mt-4 text-zinc-600">Signed in as @{me.handle}</p>}
      </main>
    </div>
  );
}
