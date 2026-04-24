export declare enum Suit {
    Hearts = "hearts",
    Diamonds = "diamonds",
    Clubs = "clubs",
    Spades = "spades"
}
export declare enum Rank {
    Seven = "7",
    Eight = "8",
    Nine = "9",
    Ten = "10",
    Jack = "J",
    Queen = "Q",
    King = "K",
    Ace = "A"
}
export interface Card {
    suit: Suit;
    rank: Rank;
}
export declare enum GamePhase {
    WaitingForPlayers = "waiting_for_players",
    Dealing = "dealing",
    Bidding = "bidding",
    Playing = "playing",
    TrickResolution = "trick_resolution",
    RoundScoring = "round_scoring",
    GameOver = "game_over"
}
export declare enum BidType {
    Pass = "pass",
    Bid = "bid",
    Coinche = "coinche",
    Surcoinche = "surcoinche"
}
export interface Bid {
    playerId: string;
    type: BidType;
    suit?: Suit;
    value?: number;
}
export declare const VALID_BID_VALUES: readonly [80, 90, 100, 110, 120, 130, 140, 150, 160, 250];
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
export declare enum RoomStatus {
    Waiting = "waiting",
    Full = "full",
    Playing = "playing",
    Finished = "finished"
}
export interface RoomState {
    id: string;
    code: string;
    hostId: string;
    status: RoomStatus;
    players: {
        id: string;
        username: string;
        seat: SeatIndex;
        ready: boolean;
    }[];
    createdAt: number;
}
export declare enum ServerEvent {
    RoomUpdate = "room:update",
    GameStarted = "game:started",
    CardsDealt = "game:cards_dealt",
    BidMade = "game:bid_made",
    ContractSet = "game:contract_set",
    YourTurn = "game:your_turn",
    CardPlayed = "game:card_played",
    TrickWon = "game:trick_won",
    RoundComplete = "game:round_complete",
    GameOver = "game:game_over",
    PlayerReconnected = "player:reconnected",
    PlayerDisconnected = "player:disconnected",
    ChatMessage = "chat:message",
    Error = "error"
}
export declare enum ClientEvent {
    JoinRoom = "room:join",
    LeaveRoom = "room:leave",
    Ready = "room:ready",
    PlaceBid = "game:bid",
    PlayCard = "game:play_card",
    SendChat = "chat:send"
}
export interface JoinRoomPayload {
    roomId: string;
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
export interface SendChatPayload {
    roomId: string;
    message: string;
}
