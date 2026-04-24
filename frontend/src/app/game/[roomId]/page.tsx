'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useGameStore } from '@/stores/game-store';
import { useSocket } from '@/hooks/use-socket';
import { PlayerSeat } from '@/components/game/PlayerSeat';
import { TrickArea } from '@/components/game/TrickArea';
import { MyHand } from '@/components/game/MyHand';
import { BiddingPanel } from '@/components/game/BiddingPanel';
import { Scoreboard } from '@/components/game/Scoreboard';

const VISUAL: Array<'bottom' | 'right' | 'top' | 'left'> = [
  'bottom',
  'right',
  'top',
  'left',
];

function parseRoomIdParam(
  raw: string | string[] | undefined,
): string | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v || v === 'undefined' || v === 'null') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

const apiBase = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function GameRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = parseRoomIdParam(params.roomId as string | string[] | undefined);
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const username = useAuthStore((s) => s.username);
  const { emit } = useSocket();

  const {
    roomCode,
    players,
    phase,
    currentTurn,
    dealer,
    chatMessages,
  } = useGameStore();

  // Must start false on server and client so first paint matches (avoids hydration mismatch).
  const [authHydrated, setAuthHydrated] = useState(false);
  const [ready, setReady] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setAuthHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setAuthHydrated(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!authHydrated) return;
    if (!token) {
      router.replace('/');
      return;
    }
    if (!roomId) {
      router.replace('/');
      return;
    }
    let cancelled = false;
    useGameStore.getState().reset();
    (async () => {
      await useAuthStore.persist.rehydrate();
      const freshToken = useAuthStore.getState().token;
      if (!freshToken || cancelled) {
        router.replace('/');
        return;
      }
      setJoinError(null);
      const res = await fetch(`${apiBase()}/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${freshToken}` },
      });
      if (cancelled) return;
      if (!res.ok) {
        setJoinError('Room not found or you cannot access it.');
        return;
      }
      const room = await res.json();
      useGameStore.getState().setRoom(room.id, room.code);
      useGameStore.getState().setPlayers(
        room.players.map((p: any) => ({
          id: p.id,
          username: p.username,
          seat: p.seat,
          team: p.seat === 0 || p.seat === 2 ? 'teamA' : 'teamB',
          cardCount: 0,
          hand: [],
          connected: true,
        })),
      );
      useGameStore.getState().setPhase('waiting_for_players');
      const jr = await emit('room:join', { roomId });
      if (cancelled) return;
      if (jr && typeof jr === 'object' && (jr as any).success === false) {
        setJoinError((jr as any).error || 'Could not join room.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authHydrated, roomId, token, router, emit]);

  const mySeat = useMemo(
    () => players.find((p) => p.id === userId)?.seat ?? 0,
    [players, userId],
  );

  const seatsAroundTable = useMemo(
    () => [0, 1, 2, 3].map((i) => ((mySeat + i) % 4) as 0 | 1 | 2 | 3),
    [mySeat],
  );

  const toggleReady = useCallback(async () => {
    if (!roomId) return;
    const next = !ready;
    setReady(next);
    await emit('room:ready', { roomId, ready: next });
  }, [emit, roomId, ready]);

  const sendChat = useCallback(async () => {
    if (!roomId) return;
    const msg = chatInput.trim();
    if (!msg) return;
    await emit('chat:send', { roomId, message: msg });
    setChatInput('');
  }, [chatInput, emit, roomId]);

  if (!authHydrated) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-white/70">Loading session…</p>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-white/70">Redirecting…</p>
      </main>
    );
  }

  if (!roomId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-white/80 mb-4">Invalid room link.</p>
        <Link href="/" className="text-gold underline">
          Back home
        </Link>
      </main>
    );
  }

  if (joinError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-red-300 mb-4">{joinError}</p>
        <Link href="/" className="text-gold underline">
          Back home
        </Link>
      </main>
    );
  }

  const inLobby = phase === 'waiting_for_players';
  const gameOver = phase === 'game_over';

  return (
    <main className="min-h-screen flex flex-col p-3 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <Link href="/" className="text-white/50 hover:text-white text-sm">
            ← Home
          </Link>
          <h1 className="text-xl font-bold text-gold mt-1">
            Table {roomCode ? `· ${roomCode}` : ''}
          </h1>
          <p className="text-white/50 text-xs">Signed in as {username}</p>
        </div>
        {inLobby && (
          <button
            type="button"
            onClick={toggleReady}
            className={`font-bold px-6 py-2 rounded-xl transition-colors ${
              ready
                ? 'bg-green-600/40 text-green-200 border border-green-500/50'
                : 'bg-gold text-black hover:bg-yellow-500'
            }`}
          >
            {ready ? 'Ready ✓' : 'Mark ready'}
          </button>
        )}
      </header>

      <div className="flex flex-1 flex-col lg:flex-row gap-4 min-h-0">
        <div className="flex-1 relative table-felt rounded-3xl min-h-[420px] border border-white/10 overflow-hidden">
          {seatsAroundTable.map((seat, i) => {
            const player = players.find((p) => p.seat === seat) ?? null;
            return (
              <PlayerSeat
                key={seat}
                player={player}
                position={VISUAL[i]}
                isCurrentTurn={player !== null && player.seat === currentTurn}
                isDealer={player !== null && player.seat === dealer}
                isMe={player !== null && player.id === userId}
              />
            );
          })}

          <div className="absolute inset-0 flex flex-col items-center justify-center pt-16 pb-28 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md px-2">
              <TrickArea />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-2 pointer-events-auto">
            <MyHand />
          </div>

          <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-full max-w-lg px-2">
            <BiddingPanel />
          </div>

          {gameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30 p-4">
              <div className="bg-felt-dark border border-gold/40 rounded-2xl p-8 text-center max-w-sm">
                <h2 className="text-2xl font-bold text-gold mb-2">Game over</h2>
                <Link
                  href="/"
                  className="inline-block mt-4 bg-gold text-black font-bold px-6 py-2 rounded-xl"
                >
                  Back to menu
                </Link>
              </div>
            </div>
          )}
        </div>

        <aside className="w-full lg:w-64 flex flex-col gap-3 shrink-0">
          <Scoreboard />
          <div className="bg-black/40 rounded-xl p-3 flex flex-col flex-1 min-h-[160px] max-h-64 lg:max-h-none">
            <h3 className="text-gold font-bold text-sm mb-2">Chat</h3>
            <div className="flex-1 overflow-y-auto space-y-1 text-xs mb-2">
              {chatMessages.map((m) => (
                <div key={`${m.timestamp}-${m.playerId}`}>
                  <span className="text-gold">{m.username}: </span>
                  <span className="text-white/80">{m.message}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Message…"
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={sendChat}
                className="bg-felt-light px-3 rounded-lg text-sm font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
