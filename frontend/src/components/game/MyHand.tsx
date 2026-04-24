'use client';

import { useGameStore, Card } from '@/stores/game-store';
import { useSocket } from '@/hooks/use-socket';
import { PlayingCard } from './PlayingCard';
import { cn, isSameCard } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * The player's hand — shown at the bottom of the table.
 */
export function MyHand() {
  const { myHand, selectedCard, isMyTurn, phase, roomId } = useGameStore();
  const { setSelectedCard } = useGameStore();
  const { emit } = useSocket();

  const canPlay = isMyTurn && phase === 'playing';

  const handleCardClick = (card: Card) => {
    if (!canPlay) return;

    if (isSameCard(selectedCard, card)) {
      // Double-click / re-select = play the card
      playCard(card);
    } else {
      setSelectedCard(card);
    }
  };

  const playCard = (card: Card) => {
    if (!roomId) return;
    emit('game:play_card', { roomId, card });
    setSelectedCard(null);
  };

  // Calculate fan-out offset for hand display
  const totalCards = myHand.length;
  const maxSpread = Math.min(totalCards * 50, 500);

  return (
    <div className="relative flex justify-center items-end" style={{ minHeight: '130px' }}>
      <AnimatePresence>
        {myHand.map((card, i) => {
          const offset = totalCards > 1 ? (i / (totalCards - 1)) * maxSpread - maxSpread / 2 : 0;
          const rotation = totalCards > 1 ? ((i / (totalCards - 1)) - 0.5) * 20 : 0;
          const isSelected = isSameCard(selectedCard, card);

          return (
            <motion.div
              key={`${card.suit}-${card.rank}`}
              layout
              initial={{ y: 100, opacity: 0 }}
              animate={{
                x: offset,
                y: isSelected ? -20 : 0,
                rotate: rotation,
                opacity: 1,
              }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{ position: 'absolute', zIndex: isSelected ? 50 : i }}
            >
              <PlayingCard
                card={card}
                selected={isSelected}
                playable={canPlay}
                onClick={() => handleCardClick(card)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Play button for selected card */}
      {selectedCard && canPlay && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => playCard(selectedCard)}
          className="absolute -top-12 bg-gold text-black font-bold px-4 py-1.5 rounded-lg
                     text-sm hover:bg-yellow-500 transition-colors z-50 shadow-lg"
        >
          Play Card
        </motion.button>
      )}
    </div>
  );
}
