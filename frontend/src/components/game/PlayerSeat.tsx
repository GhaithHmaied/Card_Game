'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@/stores/game-store';
import { CardBack } from './PlayingCard';
import { cn } from '@/lib/utils';

interface PlayerSeatProps {
  player: Player | null;
  position: 'bottom' | 'left' | 'top' | 'right';
  isCurrentTurn: boolean;
  isDealer: boolean;
  isMe: boolean;
}

const positionStyles = {
  bottom: 'bottom-0 left-1/2 -translate-x-1/2 mb-2',
  top: 'top-0 left-1/2 -translate-x-1/2 mt-2',
  left: 'left-0 top-1/2 -translate-y-1/2 ml-2',
  right: 'right-0 top-1/2 -translate-y-1/2 mr-2',
};

export function PlayerSeat({
  player,
  position,
  isCurrentTurn,
  isDealer,
  isMe,
}: PlayerSeatProps) {
  if (!player) {
    return (
      <div className={cn('absolute', positionStyles[position])}>
        <div className="bg-black/30 rounded-xl px-4 py-3 text-white/40 text-sm text-center">
          Waiting for player...
        </div>
      </div>
    );
  }

  const isHorizontal = position === 'left' || position === 'right';

  return (
    <div className={cn('absolute', positionStyles[position])}>
      <motion.div
        animate={isCurrentTurn ? { boxShadow: '0 0 20px rgba(212,168,67,0.6)' } : {}}
        className={cn(
          'rounded-xl px-4 py-2 text-center transition-all',
          isMe ? 'bg-gold/20 border border-gold/50' : 'bg-black/40 border border-white/10',
          !player.connected && 'opacity-50',
        )}
      >
        {/* Player name */}
        <div className="flex items-center gap-2 justify-center">
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              player.connected ? 'bg-green-400' : 'bg-red-400',
            )}
          />
          <span className={cn('font-semibold text-sm', isMe ? 'text-gold' : 'text-white')}>
            {player.username}
          </span>
          {isDealer && <span className="text-xs bg-gold/30 text-gold px-1.5 rounded">D</span>}
        </div>

        {/* Team badge */}
        <div className="text-xs text-white/50 mt-0.5">
          {player.team === 'teamA' ? 'Team A' : 'Team B'}
        </div>

        {/* Card count (for opponents) */}
        {!isMe && player.cardCount > 0 && (
          <div className={cn('flex gap-0.5 mt-1 justify-center', isHorizontal && 'flex-col')}>
            {Array.from({ length: Math.min(player.cardCount, 8) }).map((_, i) => (
              <div
                key={i}
                className="w-4 h-6 bg-card-back rounded-sm border border-white/10"
                style={
                  isHorizontal
                    ? { marginTop: i > 0 ? '-12px' : '0' }
                    : { marginLeft: i > 0 ? '-8px' : '0' }
                }
              />
            ))}
          </div>
        )}

        {/* Turn indicator */}
        <AnimatePresence>
          {isCurrentTurn && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-xs text-gold mt-1 font-bold"
            >
              ⏱ Playing...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disconnected notice */}
        {!player.connected && (
          <div className="text-xs text-red-400 mt-1">Reconnecting...</div>
        )}
      </motion.div>
    </div>
  );
}
