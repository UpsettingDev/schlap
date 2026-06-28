'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Checkin = {
  id: string;
  done: string | null;
  in_progress: string | null;
  blockers: string | null;
  notes: string | null;
  members: { handle: string; display_name: string; is_agent: boolean } | null;
};

const FIELDS = [
  { key: 'done', label: '✅ What did you get done?', placeholder: 'Shipped, fixed, completed...' },
  { key: 'in_progress', label: '🔄 What are you working on?', placeholder: 'Currently in progress...' },
  { key: 'blockers', label: '🚧 Any blockers?', placeholder: "What's in your way? (or leave blank)" },
  { key: 'notes', label: '📝 Notes for the team', placeholder: 'Anything else the room should know...' },
] as const;

export default function CheckinPage() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [form, setForm] = useState({ done: '', in_progress: '', blockers: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/checkin').then((r) => r.json()).then((d) => setCheckins(d.checkins ?? []));
  }, []);

  async function postCheckin() {
    await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitted(true);
    const d = await fetch('/api/checkin').then((r) => r.json());
    setCheckins(d.checkins ?? []);
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex h-full">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="px-4 py-5 border-b border-zinc-800">
          <Link href="/" className="text-lg font-bold tracking-wider text-white hover:text-zinc-300">SCHLAP</Link>
          <p className="text-xs text-zinc-500 mt-0.5">Upsetting Industries</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm px-4 text-center">
          Check in with the team daily.
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto px-8 py-8 max-w-3xl">
        <h1 className="text-xl font-bold text-white mb-1">Daily Check-in</h1>
        <p className="text-sm text-zinc-500 mb-8">{today}</p>

        {!submitted ? (
          <div className="space-y-5 mb-12">
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
                <textarea
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  rows={2}
                  className="w-full bg-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-600 resize-none"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={postCheckin}
              className="bg-white text-zinc-950 text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Post Check-in
            </button>
          </div>
        ) : (
          <div className="mb-12 p-4 bg-zinc-800 rounded-lg text-sm text-zinc-300">
            ✅ Check-in posted to #agent-standup.
          </div>
        )}

        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Today&apos;s Check-ins</h2>
        {checkins.length === 0 && <p className="text-sm text-zinc-600">No check-ins yet today.</p>}
        <div className="space-y-4">
          {checkins.map((c) => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-white">{c.members?.display_name ?? 'Unknown'}</span>
                {c.members?.is_agent && <span className="text-xs bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">agent</span>}
              </div>
              {c.done && <p className="text-sm text-zinc-300 mb-1"><span className="text-zinc-500">Done:</span> {c.done}</p>}
              {c.in_progress && <p className="text-sm text-zinc-300 mb-1"><span className="text-zinc-500">In progress:</span> {c.in_progress}</p>}
              {c.blockers && <p className="text-sm text-zinc-300 mb-1"><span className="text-zinc-500">Blockers:</span> {c.blockers}</p>}
              {c.notes && <p className="text-sm text-zinc-300"><span className="text-zinc-500">Notes:</span> {c.notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
