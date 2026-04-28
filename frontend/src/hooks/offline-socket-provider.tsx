'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useGameStore } from '@/stores/game-store';
import { GameSocketContext } from './socket-provider';
import {
  OfflineGameManager,
  OFFLINE_HUMAN_ID,
  OFFLINE_ROOM_ID,
} from '@/offline/offline-game-manager';
import { pickBotBid, pickBotCard } from '@/offline/bot';
import { GamePhase, type GameState, type Card } from '@/offline/types';

function mapOfflinePlayers(gs: GameState) {
  return gs.players.map((p) => ({
    id: p.id,
    username: p.username,
    seat: p.seat,
    team: p.team,
    cardCount: p.hand.length,
    hand: p.id === OFFLINE_HUMAN_ID ? p.hand : [],
    connected: true,
  }));
}

function syncCardsDealt(gs: GameState) {
  const store = useGameStore.getState();
  store.clearTrick();
  store.setLastTrickWinner(null);
  store.setGameId(gs.id);
  store.setPhase(gs.phase as string);
  store.setCurrentTurn(gs.currentTurn);
  store.setDealer(gs.dealer);
  store.setContract(gs.contract as any);
  store.setPlayers(mapOfflinePlayers(gs));
  const me = gs.players.find((p) => p.id === OFFLINE_HUMAN_ID);
  if (me) store.setMyHand(me.hand);
  useGameStore.setState({ currentBids: [] });
  const current = gs.players.find((p) => p.seat === gs.currentTurn);
  store.setIsMyTurn(current?.id === OFFLINE_HUMAN_ID);
}

function syncPlayersOnly(gs: GameState) {
  useGameStore.getState().setPlayers(mapOfflinePlayers(gs));
  const me = gs.players.find((p) => p.id === OFFLINE_HUMAN_ID);
  if (me) useGameStore.getState().setMyHand(me.hand);
}

export function OfflineGameSocketProvider({ children }: { children: ReactNode }) {
  const emitRef = useRef<
    (event: string, data: unknown) => Promise<unknown>
  >(() => Promise.resolve(undefined));

  useEffect(() => {
    const authSnapshot = {
      token: useAuthStore.getState().token,
      userId: useAuthStore.getState().userId,
      username: useAuthStore.getState().username,
    };

    useAuthStore.setState({
      token: 'offline-local',
      userId: OFFLINE_HUMAN_ID,
      username: 'You',
    });

    const mgr = new OfflineGameManager();
    useGameStore.getState().reset();
    const initial = mgr.startGame();
    useGameStore.getState().setRoom(OFFLINE_ROOM_ID, 'OFFLINE');
    syncCardsDealt(initial);

    const BOT_DELAY_MS = 450;

    const schedule = () => {
      queueMicrotask(() => {
        const st = mgr.getState();
        if (st.phase === GamePhase.GameOver) {
          useGameStore.setState({ isMyTurn: false });
          return;
        }

        const turnPid = st.players.find((p) => p.seat === st.currentTurn)?.id;
        if (!turnPid) return;

        if (turnPid === OFFLINE_HUMAN_ID) {
          useGameStore.setState({ isMyTurn: true });
          if (st.phase === GamePhase.Playing) {
            const me = st.players.find((p) => p.id === OFFLINE_HUMAN_ID);
            if (me) useGameStore.getState().setMyHand(me.hand);
          }
          return;
        }

        useGameStore.setState({ isMyTurn: false });
        window.setTimeout(() => {
          try {
            if (st.phase === GamePhase.Bidding) {
              applyBidResult(mgr.processBid(turnPid, pickBotBid(st, turnPid)));
            } else if (st.phase === GamePhase.Playing) {
              const card = pickBotCard(st, turnPid);
              applyPlayResult(
                turnPid,
                card,
                mgr.playCard(turnPid, { roomId: OFFLINE_ROOM_ID, card }),
              );
            }
          } catch (e) {
            console.error(e);
          }
        }, BOT_DELAY_MS);
      });
    };

    const applyBidResult = (result: ReturnType<OfflineGameManager['processBid']>) => {
      const gs = useGameStore.getState();
      gs.addBid({
        type: result.bid.type as string,
        suit: result.bid.suit,
        value: result.bid.value,
      } as any);
      gs.setIsMyTurn(false);

      if (result.biddingOver && result.allPassed) {
        useGameStore.setState({ currentBids: [] });
        syncCardsDealt(result.state);
      } else if (result.biddingOver && result.contract) {
        gs.setContract(result.contract as any);
        gs.setCurrentTurn(result.state.currentTurn);
        gs.setPhase('playing');
        gs.setIsMyTurn(false);
        syncPlayersOnly(result.state);
      } else if (!result.biddingOver) {
        gs.setCurrentTurn(result.state.currentTurn);
        syncPlayersOnly(result.state);
      }
      schedule();
    };

    const applyPlayResult = (
      playerId: string,
      card: Card,
      result: ReturnType<OfflineGameManager['playCard']>,
    ) => {
      const s = useGameStore.getState();
      s.addTrickCard({ playerId, card });
      s.setCurrentTurn(result.state.currentTurn);
      s.setIsMyTurn(false);
      if (playerId === OFFLINE_HUMAN_ID) {
        s.setMyHand(
          s.myHand.filter(
            (c) => !(c.suit === card.suit && c.rank === card.rank),
          ),
        );
      }
      syncPlayersOnly(result.state);

      const afterTrickPause = () => {
        useGameStore.getState().clearTrick();
        useGameStore.getState().setLastTrickWinner(null);
        if (result.roundComplete) {
          const rs =
            result.state.roundScores[result.state.roundScores.length - 1];
          useGameStore.getState().addRoundScore(rs as any);
          useGameStore.getState().setGameScore(result.state.gameScore);
          if (result.gameOver) {
            useGameStore.getState().setPhase('game_over');
            useGameStore.setState({ isMyTurn: false });
          } else {
            syncCardsDealt(result.state);
          }
        }
        schedule();
      };

      if (result.trickComplete && result.lastCompletedTrick) {
        const lastTrick = result.lastCompletedTrick;
        useGameStore.getState().setLastTrickWinner({
          winnerId: lastTrick.winnerId!,
          winnerTeam: lastTrick.winnerTeam!,
          cards: lastTrick.cards,
        });
        window.setTimeout(afterTrickPause, 1500);
      } else {
        schedule();
      }
    };

    emitRef.current = async (event: string, data: unknown) => {
      if (event === 'game:bid') {
        try {
          applyBidResult(mgr.processBid(OFFLINE_HUMAN_ID, data as any));
          return { success: true };
        } catch (e: any) {
          return { success: false, error: e?.message };
        }
      }

      if (event === 'game:play_card') {
        const payload = data as any;
        try {
          applyPlayResult(
            OFFLINE_HUMAN_ID,
            payload.card,
            mgr.playCard(OFFLINE_HUMAN_ID, payload),
          );
          return { success: true };
        } catch (e: any) {
          return { success: false, error: e?.message };
        }
      }

      if (event === 'chat:send') {
        const p = data as any;
        useGameStore.getState().addChatMessage({
          playerId: OFFLINE_HUMAN_ID,
          username: 'You',
          message: String(p.message ?? ''),
          timestamp: Date.now(),
        });
        return { success: true };
      }

      return { success: true };
    };

    schedule();

    return () => {
      emitRef.current = () => Promise.resolve(undefined);
      useGameStore.getState().reset();
      useAuthStore.setState({
        token: authSnapshot.token,
        userId: authSnapshot.userId,
        username: authSnapshot.username,
      });
    };
  }, []);

  const emit = useCallback((event: string, data: unknown) => {
    return Promise.resolve(emitRef.current(event, data));
  }, []);

  const value = useMemo(() => ({ emit }), [emit]);

  return (
    <GameSocketContext.Provider value={value}>{children}</GameSocketContext.Provider>
  );
}
