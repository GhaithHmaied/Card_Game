'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

const apiBase = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function HomePage() {
  const [showLogin, setShowLogin] = useState(true);
  const { isLoggedIn, username } = useAuthStore();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Logo / Title */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-gold mb-2">🃏 Coinché</h1>
        <p className="text-lg text-white/70">Belote Coinchée — Play Online</p>
        <Link
          href="/offline"
          className="inline-block mt-6 text-gold hover:text-yellow-300 text-sm font-medium underline underline-offset-4"
        >
          Practice offline (vs bots, no server)
        </Link>
      </div>

      {isLoggedIn ? (
        <LoggedInMenu username={username!} />
      ) : (
        <AuthForms showLogin={showLogin} onToggle={() => setShowLogin(!showLogin)} />
      )}
    </main>
  );
}

function LoggedInMenu({ username }: { username: string }) {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const { logout } = useAuthStore();

  const createRoom = async () => {
    setLoading(true);
    setCreateError(null);
    try {
      await useAuthStore.persist.rehydrate();
      const freshToken = useAuthStore.getState().token;
      if (!freshToken) {
        setCreateError('You are not signed in. Please sign in again.');
        return;
      }
      const res = await fetch(`${apiBase()}/rooms`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${freshToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          useAuthStore.getState().logout();
          throw new Error(
            'Session was rejected by the server (wrong or expired token). Please sign in again.',
          );
        }
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message || 'Could not create room',
        );
      }
      if (!data?.id || typeof data.id !== 'string') {
        throw new Error('Server did not return a room id. Is the API running?');
      }
      window.location.href = `/game/${data.id}`;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not create room';
      setCreateError(msg);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!roomCode.trim()) return;
    window.location.href = `/game/join/${roomCode.trim().toUpperCase()}`;
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md">
      <p className="text-center text-white/80 mb-6">
        Welcome back, <span className="text-gold font-bold">{username}</span>!
      </p>

      {createError && (
        <p className="text-red-400 text-sm text-center mb-3">{createError}</p>
      )}
      <button
        onClick={createRoom}
        disabled={loading}
        className="w-full bg-gold text-black font-bold py-3 rounded-xl mb-4
                   hover:bg-yellow-500 transition-colors disabled:opacity-50"
      >
        {loading ? 'Creating...' : '🎴 Create Game Room'}
      </button>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="Enter room code..."
          maxLength={6}
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3
                     text-white placeholder:text-white/40 uppercase tracking-widest
                     text-center font-mono"
        />
        <button
          onClick={joinRoom}
          className="bg-felt-light text-white font-bold px-6 py-3 rounded-xl
                     hover:bg-felt transition-colors"
        >
          Join
        </button>
      </div>

      <div className="flex gap-4 justify-center">
        <a href="/history" className="text-white/60 hover:text-white text-sm">
          📊 History
        </a>
        <a href="/leaderboard" className="text-white/60 hover:text-white text-sm">
          🏆 Leaderboard
        </a>
        <button onClick={logout} className="text-white/60 hover:text-red-400 text-sm">
          Logout
        </button>
      </div>
    </div>
  );
}

function AuthForms({
  showLogin,
  onToggle,
}: {
  showLogin: boolean;
  onToggle: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = showLogin ? '/auth/login' : '/auth/register';
      const body = showLogin
        ? { email, password }
        : { email, password, username };

      const res = await fetch(`${apiBase()}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Authentication failed');
      }

      const data = await res.json();
      login(data.accessToken, data.refreshToken, data.username, data.userId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md">
      <h2 className="text-xl font-bold text-center mb-6">
        {showLogin ? 'Sign In' : 'Create Account'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!showLogin && (
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3
                       text-white placeholder:text-white/40"
          />
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3
                     text-white placeholder:text-white/40"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={8}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3
                     text-white placeholder:text-white/40"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-black font-bold py-3 rounded-xl
                     hover:bg-yellow-500 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : showLogin ? 'Sign In' : 'Register'}
        </button>
      </form>

      <p className="text-center text-white/60 mt-4 text-sm">
        {showLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button onClick={onToggle} className="text-gold hover:underline">
          {showLogin ? 'Register' : 'Sign In'}
        </button>
      </p>
    </div>
  );
}
