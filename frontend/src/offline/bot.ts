import {
  GameState,
  BidType,
  Suit,
  VALID_BID_VALUES,
  Card,
} from './types';
import { BiddingService } from './engine/bidding';
import { TrickService } from './engine/trick';
import { ValidationService } from './engine/validation';
import { OFFLINE_ROOM_ID } from './offline-game-manager';
import type { PlaceBidPayload } from './types';

const bidding = new BiddingService();
const trickService = new TrickService();
const validation = new ValidationService(trickService);

export function pickBotBid(state: GameState, playerId: string): PlaceBidPayload {
  const candidates: PlaceBidPayload[] = [];

  const passBid = { playerId, type: BidType.Pass };
  if (bidding.isValidBid(passBid, state)) {
    candidates.push({ roomId: OFFLINE_ROOM_ID, type: BidType.Pass });
  }

  for (const suit of Object.values(Suit)) {
    for (const value of VALID_BID_VALUES) {
      const bid = { playerId, type: BidType.Bid, suit, value };
      if (bidding.isValidBid(bid, state)) {
        candidates.push({
          roomId: OFFLINE_ROOM_ID,
          type: BidType.Bid,
          suit,
          value,
        });
      }
    }
  }

  for (const t of [BidType.Coinche, BidType.Surcoinche]) {
    const bid = { playerId, type: t };
    if (bidding.isValidBid(bid as any, state)) {
      candidates.push({ roomId: OFFLINE_ROOM_ID, type: t });
    }
  }

  if (candidates.length === 0) {
    return { roomId: OFFLINE_ROOM_ID, type: BidType.Pass };
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function pickBotCard(state: GameState, playerId: string): Card {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !state.contract) {
    throw new Error('Bot play: invalid state');
  }

  const legal = validation.getLegalPlays(
    player.hand,
    state.currentTrick,
    state.contract.suit,
    playerId,
    state,
  );

  if (legal.length === 0) {
    throw new Error('Bot has no legal plays');
  }

  return legal[Math.floor(Math.random() * legal.length)];
}
