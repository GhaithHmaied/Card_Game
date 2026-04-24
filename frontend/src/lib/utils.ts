import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Card } from '@/stores/game-store';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<string, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-gray-900',
  spades: 'text-gray-900',
};

const SUIT_LABELS: Record<string, string> = {
  hearts: 'Hearts',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
  spades: 'Spades',
};

export function suitSymbol(suit: string): string {
  return SUIT_SYMBOLS[suit] ?? suit;
}

export function suitColor(suit: string): string {
  return SUIT_COLORS[suit] ?? '';
}

export function suitLabel(suit: string): string {
  return SUIT_LABELS[suit] ?? suit;
}

export function cardLabel(card: Card): string {
  return `${card.rank}${suitSymbol(card.suit)}`;
}

export function isSameCard(a: Card | null, b: Card | null): boolean {
  if (!a || !b) return false;
  return a.suit === b.suit && a.rank === b.rank;
}
