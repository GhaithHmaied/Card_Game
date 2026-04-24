import { create } from 'zustand';

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
}

export interface Player {
  id: string;
  username: string;
  seat: number;
  team: 'teamA' | 'teamB';
  cardCount: number;
  hand: (Card | null)[];
  connected: boolean;
}

export interface TrickCard {
  playerId: string;
  card: Card;
}

export interface ChatMessage {
  playerId: string;
  username: string;
  message: string;
  timestamp: number;
}

interface GameState {
  // Room
  roomId: string | null;
  roomCode: string | null;

  // Game
  gameId: string | null;
  phase: string;
  players: Player[];
  myHand: Card[];
  currentTurn: number;
  dealer: number;

  // Bidding
  currentBids: { playerId: string; type: string; suit?: string; value?: number }[];
  contract: { team: string; suit: string; value: number; coinched: boolean; surcoinched: boolean } | null;

  // Playing
  currentTrick: TrickCard[];
  lastTrickWinner: { winnerId: string; winnerTeam: string; cards: TrickCard[] } | null;

  // Scores
  gameScore: { teamA: number; teamB: number };
  roundScores: { teamA: number; teamB: number; capot: boolean; contractFulfilled: boolean }[];

  // Chat
  chatMessages: ChatMessage[];

  // UI state
  selectedCard: Card | null;
  isMyTurn: boolean;

  // Actions
  setRoom: (roomId: string, roomCode: string) => void;
  setGameId: (gameId: string | null) => void;
  setPlayers: (players: Player[]) => void;
  setMyHand: (hand: Card[]) => void;
  setPhase: (phase: string) => void;
  setCurrentTurn: (turn: number) => void;
  setDealer: (seat: number) => void;
  addBid: (bid: any) => void;
  setContract: (contract: any) => void;
  addTrickCard: (tc: TrickCard) => void;
  clearTrick: () => void;
  setLastTrickWinner: (winner: any) => void;
  setGameScore: (score: { teamA: number; teamB: number }) => void;
  addRoundScore: (score: any) => void;
  setSelectedCard: (card: Card | null) => void;
  setIsMyTurn: (val: boolean) => void;
  addChatMessage: (msg: ChatMessage) => void;
  reset: () => void;
}

const initialState = {
  roomId: null,
  roomCode: null,
  gameId: null,
  phase: 'waiting_for_players',
  players: [],
  myHand: [],
  currentTurn: 0,
  dealer: 0,
  currentBids: [],
  contract: null,
  currentTrick: [],
  lastTrickWinner: null,
  gameScore: { teamA: 0, teamB: 0 },
  roundScores: [],
  chatMessages: [],
  selectedCard: null,
  isMyTurn: false,
};

export const useGameStore = create<GameState>()((set) => ({
  ...initialState,

  setRoom: (roomId, roomCode) => set({ roomId, roomCode }),
  setGameId: (gameId) => set({ gameId }),
  setPlayers: (players) => set({ players }),
  setMyHand: (hand) => set({ myHand: hand }),
  setPhase: (phase) => set({ phase }),
  setCurrentTurn: (turn) => set({ currentTurn: turn }),
  setDealer: (seat) => set({ dealer: seat }),
  addBid: (bid) => set((s) => ({ currentBids: [...s.currentBids, bid] })),
  setContract: (contract) => set({ contract, currentBids: [] }),
  addTrickCard: (tc) => set((s) => ({ currentTrick: [...s.currentTrick, tc] })),
  clearTrick: () => set({ currentTrick: [] }),
  setLastTrickWinner: (winner) => set({ lastTrickWinner: winner }),
  setGameScore: (score) => set({ gameScore: score }),
  addRoundScore: (score) => set((s) => ({ roundScores: [...s.roundScores, score] })),
  setSelectedCard: (card) => set({ selectedCard: card }),
  setIsMyTurn: (val) => set({ isMyTurn: val }),
  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages.slice(-100), msg] })),
  reset: () => set(initialState),
}));
