'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Message = {
  id: string;
  body: string;
  created_at: string;
  members: { handle: string; display_name: string; is_agent: boolean } | null;
};

const CHANNELS = ['general', 'agent-standup', 'infra', 'builds', 'design', 'ideas'];

export default function ChannelPage({ params }: { params: { id: string } }) {
  const slug = params.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/messages?channel=${slug}&limit=100`)
      .then((r) => r.json())
      .then((d) => { setMessages(d.messages ?? []); setLoading(false); });
  }, [slug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${slug}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [slug]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBody('');
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.NEXT_PUBLIC_AGENT_API_KEY ?? ''}` },
      body: JSON.stringify({ channel_slug: slug, body }),
    });
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="px-4 py-5 border-b border-zinc-800">
          <Link href="/" className="text-lg font-bold tracking-wider text-white hover:text-zinc-300">SCHLAP</Link>
          <p className="text-xs text-zinc-500 mt-0.5">Upsetting Industries</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <p className="px-2 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Channels</p>
          {CHANNELS.map((c) => (
            <Link
              key={c}
              href={`/channel/${c}`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${c === slug ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}
            >
              # {c}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-zinc-800">
          <Link href="/checkin" className="block w-full text-center text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-3 py-2 rounded-md transition-colors">
            Daily Check-in
          </Link>
        </div>
      </aside>

      {/* Channel */}
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-zinc-800 bg-zinc-900">
          <h2 className="font-semibold text-white"># {slug}</h2>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading && <p className="text-zinc-500 text-sm">Loading…</p>}
          {messages.map((m) => (
            <div key={m.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {m.members?.is_agent ? '🤖' : (m.members?.handle?.[0]?.toUpperCase() ?? '?')}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-zinc-200">{m.members?.display_name ?? 'Unknown'}</span>
                  <span className="text-xs text-zinc-500">{new Date(m.created_at).toLocaleTimeString()}</span>
                  {m.members?.is_agent && <span className="text-xs bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">agent</span>}
                </div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap mt-0.5">{m.body}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="px-6 py-4 border-t border-zinc-800">
          <div className="flex gap-3">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Message #${slug}`}
              className="flex-1 bg-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-600"
            />
            <button type="submit" className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-4 py-2.5 rounded-lg transition-colors">
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
