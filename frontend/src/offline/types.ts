/** Coinché types — aligned with backend `common/types/game.types.ts` for offline engine. */

export enum Suit {
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
  Spades = 'spades',
}

export enum Rank {
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

export interface Card {
  suit: Suit;
  rank: Rank;
}

export enum GamePhase {
  WaitingForPlayers = 'waiting_for_players',
  Dealing = 'dealing',
  Bidding = 'bidding',
  Playing = 'playing',
  TrickResolution = 'trick_resolution',
  RoundScoring = 'round_scoring',
  GameOver = 'game_over',
}

export enum BidType {
  Pass = 'pass',
  Bid = 'bid',
  Coinche = 'coinche',
  Surcoinche = 'surcoinche',
}

export interface Bid {
  playerId: string;
  type: BidType;
  suit?: Suit;
  value?: number;
}

export const VALID_BID_VALUES = [80, 90, 100, 110, 120, 130, 140, 150, 160, 250] as const;

export interface Contract {
  team: TeamId;
  playerId: string;
  suit: Suit;
  value: number;
  coinched: boolean;
  surcoinched: boolean;
}

export type TeamId = 'teamA' | 'teamB';

export type SeatIndex = 0 | 1 | 2 | 3;

export interface PlayerState {
  id: string;
  username: string;
  seat: SeatIndex;
  team: TeamId;
  hand: Card[];
  connected: boolean;
  disconnectedAt?: number;
}

export interface TrickCard {
  playerId: string;
  card: Card;
}

export interface Trick {
  cards: TrickCard[];
  leadSuit: Suit;
  winnerId?: string;
  winnerTeam?: TeamId;
}

export interface RoundScore {
  teamA: number;
  teamB: number;
  beloteTeam?: TeamId;
  capot: boolean;
  contractFulfilled: boolean;
}

export interface GameScore {
  teamA: number;
  teamB: number;
}

export interface GameState {
  id: string;
  roomId: string;
  phase: GamePhase;
  players: PlayerState[];
  dealer: SeatIndex;
  currentTurn: SeatIndex;
  bids: Bid[];
  contract: Contract | null;
  consecutivePasses: number;
  currentTrick: Trick;
  completedTricks: Trick[];
  trickCount: number;
  roundScores: RoundScore[];
  gameScore: GameScore;
  targetScore: number;
  turnStartedAt: number;
  turnTimeoutMs: number;
  createdAt: number;
  updatedAt: number;
}

export interface PlaceBidPayload {
  roomId: string;
  type: BidType;
  suit?: Suit;
  value?: number;
}

export interface PlayCardPayload {
  roomId: string;
  card: Card;
}
