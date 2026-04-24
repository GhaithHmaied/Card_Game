'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, TrickCard } from '@/stores/game-store';
import { useAuthStore } from '@/stores/auth-store';
import { PlayingCard } from './PlayingCard';
import { cn, suitSymbol } from '@/lib/utils';

/**
 * Center of the table: shows the current trick cards + contract info.
 */
export function TrickArea() {
  const { currentTrick, lastTrickWinner, contract, players } = useGameStore();
  const userId = useAuthStore((s) => s.userId);
  const mySeat = players.find((p) => p.id === userId)?.seat ?? 0;

  /** Rotate seats so local player is always at the bottom of the trick layout. */
  const getCardPosition = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return {};
    const rel = (player.seat - mySeat + 4) % 4;
    switch (rel) {
      case 0:
        return { bottom: '10px', left: '50%', transform: 'translateX(-50%)' };
      case 1:
        return { right: '10px', top: '50%', transform: 'translateY(-50%)' };
      case 2:
        return { top: '10px', left: '50%', transform: 'translateX(-50%)' };
      case 3:
        return { left: '10px', top: '50%', transform: 'translateY(-50%)' };
      default:
        return {};
    }
  };

  return (
    <div className="relative w-[300px] h-[220px] mx-auto">
      {/* Contract display */}
      {contract && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5
                        bg-black/50 rounded-full px-3 py-1 text-xs">
          <span className="text-white/70">Contract:</span>
          <span className="text-gold font-bold">
            {contract.value === 250 ? 'Capot' : contract.value} {suitSymbol(contract.suit)}
          </span>
          <span className="text-white/40">by {contract.team}</span>
          {contract.coinched && <span className="text-red-400 font-bold">×2</span>}
          {contract.surcoinched && <span className="text-red-300 font-bold">×4</span>}
        </div>
      )}

      {/* Trick cards */}
      <AnimatePresence>
        {currentTrick.map((tc: TrickCard, i: number) => (
          <motion.div
            key={`${tc.playerId}-${tc.card.suit}-${tc.card.rank}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="absolute"
            style={getCardPosition(tc.playerId)}
          >
            <PlayingCard card={tc.card} small />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Trick winner flash */}
      <AnimatePresence>
        {lastTrickWinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="bg-gold/30 backdrop-blur-sm rounded-2xl px-6 py-3 text-center">
              <div className="text-gold font-bold text-lg">Trick Won!</div>
              <div className="text-white/80 text-sm">
                {players.find((p) => p.id === lastTrickWinner.winnerId)?.username}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {currentTrick.length === 0 && !lastTrickWinner && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-2 border-white/10 border-dashed" />
        </div>
      )}
    </div>
  );
}
