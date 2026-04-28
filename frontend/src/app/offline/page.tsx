'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useGameStore } from '@/stores/game-store';
import { useSocket } from '@/hooks/use-socket';
import { PlayerSeat } from '@/components/game/PlayerSeat';
import { TrickArea } from '@/components/game/TrickArea';
import { MyHand } from '@/components/game/MyHand';
import { BiddingPanel } from '@/components/game/BiddingPanel';
import { Scoreboard } from '@/components/game/Scoreboard';
import { OFFLINE_ROOM_ID } from '@/offline/offline-game-manager';

const VISUAL: Array<'bottom' | 'right' | 'top' | 'left'> = [
  'bottom',
  'right',
  'top',
  'left',
];

export default function OfflineGamePage() {
  const userId = useAuthStore((s) => s.userId);
  const username = useAuthStore((s) => s.username);
  const { emit } = useSocket();

  const { roomCode, players, phase, currentTurn, dealer, chatMessages } =
    useGameStore();

  const [chatInput, setChatInput] = useState('');

  const mySeat = useMemo(
    () => players.find((p) => p.id === userId)?.seat ?? 0,
    [players, userId],
  );

  const seatsAroundTable = useMemo(
    () => [0, 1, 2, 3].map((i) => ((mySeat + i) % 4) as 0 | 1 | 2 | 3),
    [mySeat],
  );

  const sendChat = useCallback(async () => {
    const msg = chatInput.trim();
    if (!msg) return;
    await emit('chat:send', { roomId: OFFLINE_ROOM_ID, message: msg });
    setChatInput('');
  }, [chatInput, emit]);

  const gameOver = phase === 'game_over';

  return (
    <main className="min-h-screen flex flex-col p-3 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <Link href="/" className="text-white/50 hover:text-white text-sm">
            ← Home
          </Link>
          <h1 className="text-xl font-bold text-gold mt-1">
            Offline practice {roomCode ? `· ${roomCode}` : ''}
          </h1>
          <p className="text-white/50 text-xs">
            You vs bots — no account or server needed · {username}
          </p>
        </div>
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
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-block mt-4 bg-gold text-black font-bold px-6 py-2 rounded-xl mr-2"
                >
                  Play again
                </button>
                <Link
                  href="/"
                  className="inline-block mt-4 border border-white/30 text-white font-bold px-6 py-2 rounded-xl"
                >
                  Home
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
