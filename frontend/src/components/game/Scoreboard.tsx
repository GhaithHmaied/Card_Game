'use client';

import { useGameStore } from '@/stores/game-store';
import { cn, suitSymbol } from '@/lib/utils';

export function Scoreboard() {
  const { gameScore, roundScores, contract } = useGameStore();

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 w-48">
      <h3 className="text-gold font-bold text-sm text-center mb-2">Score</h3>

      {/* Total scores */}
      <div className="flex justify-between mb-3">
        <div className="text-center flex-1">
          <div className="text-xs text-white/50">Team A</div>
          <div className="text-2xl font-bold text-white">{gameScore.teamA}</div>
        </div>
        <div className="text-white/30 self-center text-lg">—</div>
        <div className="text-center flex-1">
          <div className="text-xs text-white/50">Team B</div>
          <div className="text-2xl font-bold text-white">{gameScore.teamB}</div>
        </div>
      </div>

      {/* Current contract */}
      {contract && (
        <div className="bg-white/5 rounded-lg p-2 mb-2 text-center text-xs">
          <span className="text-white/50">Contract: </span>
          <span className="text-gold font-bold">
            {contract.value === 250 ? 'Capot' : contract.value} {suitSymbol(contract.suit)}
          </span>
          {contract.coinched && <span className="text-red-400"> ×2</span>}
          {contract.surcoinched && <span className="text-red-300"> ×4</span>}
        </div>
      )}

      {/* Round history */}
      {roundScores.length > 0 && (
        <div className="border-t border-white/10 pt-2 mt-2">
          <div className="text-xs text-white/40 mb-1">Rounds</div>
          <div className="space-y-0.5 max-h-32 overflow-y-auto">
            {roundScores.map((rs, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className={cn(
                  rs.teamA > rs.teamB ? 'text-green-400' : 'text-white/60',
                )}>
                  {rs.teamA}
                </span>
                <span className="text-white/20">R{i + 1}</span>
                <span className={cn(
                  rs.teamB > rs.teamA ? 'text-green-400' : 'text-white/60',
                )}>
                  {rs.teamB}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target */}
      <div className="text-center text-xs text-white/30 mt-2">Target: 1000</div>
    </div>
  );
}
