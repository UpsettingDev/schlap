'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type DM = {
  id: string;
  body: string;
  created_at: string;
  from_id: string;
  sender: { handle: string; display_name: string; is_agent: boolean } | null;
};

type Member = { handle: string; display_name: string; is_agent: boolean };

const CHANNELS = ['general', 'agent-standup', 'infra', 'builds', 'design', 'ideas'];

export default function DMPage() {
  const params = useParams<{ handle: string }>();
  const handle = params.handle;

  const [messages, setMessages] = useState<DM[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then((d) => setMe(d.member));
    fetch('/api/members').then((r) => r.json()).then((d) => setMembers(d.members ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dm?with=${handle}`)
      .then((r) => r.json())
      .then((d) => { setMessages(d.messages ?? []); setLoading(false); });
  }, [handle]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new DMs every 5s (realtime for DMs needs IDs; polling is fine for v1)
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/dm?with=${handle}`)
        .then((r) => r.json())
        .then((d) => setMessages(d.messages ?? []));
    }, 5000);
    return () => clearInterval(interval);
  }, [handle]);

  async function send() {
    if (!body.trim()) return;
    const draft = body;
    setBody('');
    const res = await fetch('/api/dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_handle: handle, body: draft }),
    });
    if (res.ok) {
      const d = await fetch(`/api/dm?with=${handle}`).then((r) => r.json());
      setMessages(d.messages ?? []);
    }
  }

  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' });
    window.location.href = '/login';
  }

  const otherMember = members.find((m) => m.handle === handle);

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
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              # {c}
            </Link>
          ))}

          {members.length > 0 && (
            <>
              <p className="px-2 mt-5 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Direct Messages</p>
              {members
                .filter((m) => m.handle !== me?.handle)
                .map((m) => (
                  <Link
                    key={m.handle}
                    href={`/dm/${m.handle}`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${m.handle === handle ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}
                  >
                    <span className="text-xs">{m.is_agent ? '🤖' : '○'}</span>
                    {m.display_name}
                  </Link>
                ))}
            </>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-zinc-800 space-y-2">
          <Link href="/checkin" className="block w-full text-center text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-3 py-2 rounded-md transition-colors">
            Daily Check-in
          </Link>
          {me && (
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-medium text-zinc-300">@{me.handle}</span>
              <button onClick={signOut} className="hover:text-zinc-200 transition-colors">sign out</button>
            </div>
          )}
        </div>
      </aside>

      {/* DM thread */}
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-zinc-800 bg-zinc-900">
          <h2 className="font-semibold text-white">
            {otherMember?.is_agent ? '🤖 ' : ''}{otherMember?.display_name ?? handle}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">@{handle}</p>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading && <p className="text-zinc-500 text-sm">Loading…</p>}
          {!loading && messages.length === 0 && (
            <p className="text-zinc-600 text-sm">No messages yet. Say hi!</p>
          )}
          {messages.map((m) => {
            const isMe = m.sender?.handle === me?.handle;
            return (
              <div key={m.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {m.sender?.is_agent ? '🤖' : (m.sender?.handle?.[0]?.toUpperCase() ?? '?')}
                </div>
                <div className={`max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`flex items-baseline gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-semibold text-zinc-200">{m.sender?.display_name ?? 'Unknown'}</span>
                    <span className="text-xs text-zinc-500">{new Date(m.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className={`text-sm whitespace-pre-wrap mt-0.5 px-3 py-2 rounded-lg ${isMe ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-800 text-zinc-300'}`}>
                    {m.body}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="px-6 py-4 border-t border-zinc-800">
          <div className="flex gap-3">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`Message ${otherMember?.display_name ?? handle}`}
              className="flex-1 bg-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-600"
            />
            <button type="button" onClick={send} className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-4 py-2.5 rounded-lg transition-colors">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
