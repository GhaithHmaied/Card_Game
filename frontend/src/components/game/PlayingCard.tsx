'use client';

import { motion } from 'framer-motion';
import { Card } from '@/stores/game-store';
import { cn, suitSymbol, suitColor } from '@/lib/utils';

interface PlayingCardProps {
  card: Card;
  selected?: boolean;
  playable?: boolean;
  small?: boolean;
  onClick?: () => void;
}

export function PlayingCard({
  card,
  selected = false,
  playable = false,
  small = false,
  onClick,
}: PlayingCardProps) {
  const color = suitColor(card.suit);
  const symbol = suitSymbol(card.suit);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={playable ? { y: -12, scale: 1.05 } : undefined}
      whileTap={playable ? { scale: 0.95 } : undefined}
      onClick={playable ? onClick : undefined}
      className={cn(
        'playing-card bg-card-front flex flex-col items-center justify-between p-1.5 border-2 select-none',
        small ? 'w-[50px] h-[72px] text-xs' : 'w-[70px] h-[100px]',
        selected && 'selected',
        playable && 'cursor-pointer hover:shadow-xl',
        !playable && 'opacity-80',
        'border-gray-300',
      )}
    >
      {/* Top-left rank + suit */}
      <div className={cn('self-start leading-none font-bold', color)}>
        <div className={small ? 'text-xs' : 'text-sm'}>{card.rank}</div>
        <div className={small ? 'text-xs' : 'text-sm'}>{symbol}</div>
      </div>

      {/* Center suit */}
      <div className={cn('font-bold', color, small ? 'text-xl' : 'text-3xl')}>
        {symbol}
      </div>

      {/* Bottom-right rank + suit (rotated) */}
      <div className={cn('self-end leading-none font-bold rotate-180', color)}>
        <div className={small ? 'text-xs' : 'text-sm'}>{card.rank}</div>
        <div className={small ? 'text-xs' : 'text-sm'}>{symbol}</div>
      </div>
    </motion.div>
  );
}

export function CardBack({ small = false }: { small?: boolean }) {
  return (
    <div
      className={cn(
        'card-back flex items-center justify-center',
        small ? 'w-[50px] h-[72px]' : 'w-[70px] h-[100px]',
      )}
    >
      <span className="text-white/30 text-lg">🂠</span>
    </div>
  );
}
