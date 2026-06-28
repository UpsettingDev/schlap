'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/login/confirm` },
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center h-full bg-zinc-950">
      <div className="w-full max-w-sm px-6 py-8 bg-zinc-900 border border-zinc-800 rounded-xl">
        <h1 className="text-xl font-bold text-white mb-1 tracking-wide">SCHLAP</h1>
        <p className="text-sm text-zinc-500 mb-8">Upsetting Industries internal comms</p>
        {sent ? (
          <div className="text-sm text-zinc-300 space-y-2">
            <p>✅ Magic link sent to <span className="text-white">{email}</span></p>
            <p className="text-zinc-500">Check your inbox and click the link to sign in.</p>
          </div>
        ) : (
          <form onSubmit={signIn} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@upsetting.software"
                required
                className="w-full bg-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-zinc-950 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
