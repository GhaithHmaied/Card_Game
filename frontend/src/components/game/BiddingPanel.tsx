'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';
import { useSocket } from '@/hooks/use-socket';
import { cn, suitSymbol } from '@/lib/utils';

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const BID_VALUES = [80, 90, 100, 110, 120, 130, 140, 150, 160, 250];

export function BiddingPanel() {
  const { roomId, currentBids, contract, isMyTurn, phase } = useGameStore();
  const { emit } = useSocket();
  const [selectedSuit, setSelectedSuit] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  if (phase !== 'bidding') return null;

  const lastRealBid = [...currentBids].reverse().find((b) => b.type === 'bid');
  const minBid = lastRealBid ? (lastRealBid.value ?? 80) + 10 : 80;
  const canCoinche = lastRealBid && !currentBids.some((b) => b.type === 'coinche');
  const canSurcoinche = currentBids.some((b) => b.type === 'coinche') && !currentBids.some((b) => b.type === 'surcoinche');

  const placeBid = () => {
    if (!selectedSuit || !selectedValue || !roomId) return;
    emit('game:bid', {
      roomId,
      type: 'bid',
      suit: selectedSuit,
      value: selectedValue,
    });
    setSelectedSuit(null);
    setSelectedValue(null);
  };

  const pass = () => {
    if (!roomId) return;
    emit('game:bid', { roomId, type: 'pass' });
  };

  const coinche = () => {
    if (!roomId) return;
    emit('game:bid', { roomId, type: 'coinche' });
  };

  const surcoinche = () => {
    if (!roomId) return;
    emit('game:bid', { roomId, type: 'surcoinche' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/50 backdrop-blur-sm rounded-2xl p-4 w-full max-w-lg"
    >
      <h3 className="text-gold font-bold text-center mb-3">Bidding Phase</h3>

      {/* Bid History */}
      <div className="flex flex-wrap gap-1 mb-3 justify-center min-h-[32px]">
        <AnimatePresence>
          {currentBids.map((bid, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                bid.type === 'pass'
                  ? 'bg-white/10 text-white/50'
                  : bid.type === 'coinche'
                    ? 'bg-red-500/30 text-red-300'
                    : bid.type === 'surcoinche'
                      ? 'bg-red-600/40 text-red-200'
                      : 'bg-gold/20 text-gold',
              )}
            >
              {bid.type === 'pass'
                ? 'Pass'
                : bid.type === 'coinche'
                  ? 'Coinche!'
                  : bid.type === 'surcoinche'
                    ? 'Surcoinche!'
                    : `${bid.value} ${suitSymbol(bid.suit!)}`}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Controls (only shown on player's turn) */}
      {isMyTurn && (
        <div className="space-y-3">
          {/* Suit selection */}
          <div className="flex justify-center gap-2">
            {SUITS.map((suit) => (
              <button
                key={suit}
                onClick={() => setSelectedSuit(suit)}
                className={cn(
                  'w-12 h-12 rounded-xl text-2xl transition-all border-2',
                  selectedSuit === suit
                    ? 'border-gold bg-gold/20 scale-110'
                    : 'border-white/20 bg-white/5 hover:bg-white/10',
                  suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-white',
                )}
              >
                {suitSymbol(suit)}
              </button>
            ))}
          </div>

          {/* Value selection */}
          <div className="flex flex-wrap justify-center gap-1">
            {BID_VALUES.filter((v) => v >= minBid || v === 250).map((value) => (
              <button
                key={value}
                onClick={() => setSelectedValue(value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                  selectedValue === value
                    ? 'border-gold bg-gold/20 text-gold'
                    : 'border-white/20 text-white/70 hover:bg-white/10',
                  value === 250 && 'text-red-400 border-red-400/30',
                )}
              >
                {value === 250 ? 'Capot' : value}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-2">
            <button
              onClick={placeBid}
              disabled={!selectedSuit || !selectedValue}
              className="bg-gold text-black font-bold px-6 py-2 rounded-xl
                         hover:bg-yellow-500 transition-colors disabled:opacity-30"
            >
              Bid {selectedValue && selectedSuit ? `${selectedValue} ${suitSymbol(selectedSuit)}` : ''}
            </button>
            <button
              onClick={pass}
              className="bg-white/10 text-white/70 font-medium px-6 py-2 rounded-xl
                         hover:bg-white/20 transition-colors"
            >
              Pass
            </button>
            {canCoinche && (
              <button
                onClick={coinche}
                className="bg-red-500/30 text-red-300 font-bold px-4 py-2 rounded-xl
                           hover:bg-red-500/50 transition-colors"
              >
                Coinche!
              </button>
            )}
            {canSurcoinche && (
              <button
                onClick={surcoinche}
                className="bg-red-600/40 text-red-200 font-bold px-4 py-2 rounded-xl
                           hover:bg-red-600/60 transition-colors"
              >
                Surcoinche!
              </button>
            )}
          </div>
        </div>
      )}

      {!isMyTurn && (
        <p className="text-center text-white/50 text-sm animate-pulse">
          Waiting for other player's bid...
        </p>
      )}
    </motion.div>
  );
}
