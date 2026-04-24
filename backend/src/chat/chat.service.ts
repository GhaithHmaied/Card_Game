import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  private readonly MAX_MESSAGE_LENGTH = 500;

  /**
   * Sanitize a chat message. Returns null if message is empty/invalid.
   */
  sanitize(message: string): string | null {
    if (!message || typeof message !== 'string') return null;

    // Trim and limit length
    const trimmed = message.trim().slice(0, this.MAX_MESSAGE_LENGTH);
    if (trimmed.length === 0) return null;

    // Strip HTML tags to prevent XSS
    const cleaned = trimmed.replace(/<[^>]*>/g, '');

    return cleaned || null;
  }
}
