'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { useGameStore } from '@/stores/game-store';

type SocketContextValue = {
  emit: (event: string, data: unknown) => Promise<unknown>;
};

export const GameSocketContext = createContext<SocketContextValue | null>(null);

/**
 * Mount once under `app/game/layout` so game UI shares one Socket.IO connection.
 */
export function GameSocketProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !userId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    const newSocket = io(`${wsUrl}/game`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;

    const mapRoomPlayers = (players: any[]) =>
      players.map((p: any) => ({
        id: p.id,
        username: p.username,
        seat: p.seat,
        team: p.seat === 0 || p.seat === 2 ? ('teamA' as const) : ('teamB' as const),
        cardCount:
          typeof p.cardCount === 'number'
            ? p.cardCount
            : Array.isArray(p.hand)
              ? p.hand.length
              : 0,
        hand: Array.isArray(p.hand) ? p.hand : [],
        connected: p.connected !== false,
      }));

    newSocket.on('room:update', (room: any) => {
      useGameStore.getState().setRoom(room.id, room.code);
      useGameStore.getState().setPlayers(mapRoomPlayers(room.players));
    });

    newSocket.on('game:started', (data: any) => {
      useGameStore.getState().setGameId(data.gameId);
      useGameStore.getState().setPhase(data.phase);
      useGameStore.getState().setCurrentTurn(data.currentTurn);
      useGameStore.getState().setDealer(data.dealer);
    });

    newSocket.on('game:cards_dealt', (gameState: any) => {
      const gs = useGameStore.getState();
      // New deal (including after a full round): reset trick UI from previous round
      gs.clearTrick();
      gs.setLastTrickWinner(null);
      gs.setGameId(gameState.id);
      gs.setPhase(gameState.phase);
      gs.setCurrentTurn(gameState.currentTurn);
      gs.setDealer(gameState.dealer);
      gs.setContract(gameState.contract ?? null);
      gs.setPlayers(mapRoomPlayers(gameState.players));
      const me = gameState.players.find((p: any) => p.id === userId);
      if (me?.hand) gs.setMyHand(me.hand.filter(Boolean) as any);
      useGameStore.setState({ currentBids: [] });
      // Derive turn from state so bidding still works if game:your_turn is delayed or dropped
      const current = gameState.players.find(
        (p: any) => p.seat === gameState.currentTurn,
      );
      gs.setIsMyTurn(current?.id === userId);
    });

    newSocket.on('game:bid_made', (data: any) => {
      useGameStore.getState().addBid(data.bid);
      useGameStore.getState().setIsMyTurn(false);
      if (data.biddingOver && data.allPassed) {
        useGameStore.setState({ currentBids: [] });
      }
    });

    newSocket.on('game:contract_set', (data: any) => {
      useGameStore.getState().setContract(data.contract);
      useGameStore.getState().setCurrentTurn(data.currentTurn);
      useGameStore.getState().setPhase('playing');
      useGameStore.getState().setIsMyTurn(false);
    });

    newSocket.on('game:your_turn', (data: any) => {
      useGameStore.getState().setIsMyTurn(true);
      if (data.hand?.length) {
        useGameStore.getState().setMyHand(data.hand.filter(Boolean) as any);
      }
    });

    newSocket.on('game:card_played', (data: any) => {
      const s = useGameStore.getState();
      s.addTrickCard({ playerId: data.playerId, card: data.card });
      s.setCurrentTurn(data.currentTurn);
      s.setIsMyTurn(false);
      if (data.playerId === userId) {
        s.setMyHand(
          s.myHand.filter(
            (c) => !(c.suit === data.card.suit && c.rank === data.card.rank),
          ),
        );
      }
    });

    newSocket.on('game:trick_won', (data: any) => {
      useGameStore.getState().setLastTrickWinner(data);
      setTimeout(() => useGameStore.getState().clearTrick(), 1500);
    });

    newSocket.on('game:round_complete', (data: any) => {
      useGameStore.getState().addRoundScore(data.roundScore);
      useGameStore.getState().setGameScore(data.gameScore);
    });

    newSocket.on('game:game_over', (data: any) => {
      useGameStore.getState().setPhase('game_over');
      useGameStore.getState().setGameScore(data.finalScore);
      useGameStore.getState().setIsMyTurn(false);
    });

    newSocket.on('player:disconnected', (data: any) => {
      const s = useGameStore.getState();
      s.setPlayers(
        s.players.map((p) =>
          p.id === data.playerId ? { ...p, connected: false } : p,
        ),
      );
    });

    newSocket.on('player:reconnected', (data: any) => {
      if (data.players) {
        useGameStore.getState().setPlayers(mapRoomPlayers(data.players));
        const me = data.players.find((p: any) => p.id === userId);
        if (me?.hand) useGameStore.getState().setMyHand(me.hand.filter(Boolean) as any);
      }
    });

    newSocket.on('chat:message', (msg: any) => {
      useGameStore.getState().addChatMessage(msg);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [token, userId]);

  const emit = useCallback((event: string, data: unknown) => {
    return new Promise<unknown>((resolve) => {
      const sock = socketRef.current;
      if (sock) sock.emit(event, data, resolve);
      else resolve(undefined);
    });
  }, []);

  const contextValue = useMemo(() => ({ emit }), [emit]);

  return (
    <GameSocketContext.Provider value={contextValue}>
      {children}
    </GameSocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(GameSocketContext);
  if (!ctx) {
    throw new Error(
      'useSocket must be used within GameSocketProvider or OfflineGameSocketProvider',
    );
  }
  return ctx;
}
