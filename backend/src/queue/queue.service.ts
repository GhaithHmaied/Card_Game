import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_CLIENT } from './queue.constants';

@Injectable()
export class QueueService {
  constructor(
    @Inject(RABBITMQ_CLIENT) private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.client.connect();
  }

  emit(pattern: string, data: any): void {
    this.client.emit(pattern, data);
  }

  /**
   * Publish a game event for async processing (history, analytics, etc.)
   */
  publishGameEvent(eventType: string, payload: Record<string, any>): void {
    this.emit('game.event', {
      type: eventType,
      payload,
      timestamp: Date.now(),
    });
  }
}
