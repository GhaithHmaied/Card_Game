import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Stand-in for {@link QueueService} when DEV_LITE=true (no RabbitMQ client).
 */
@Injectable()
export class NoopQueueService implements OnModuleInit {
  private readonly log = new Logger(NoopQueueService.name);

  onModuleInit() {
    this.log.warn('DEV_LITE: RabbitMQ disabled (queue events are dropped).');
  }

  emit(_pattern: string, _data: unknown): void {}

  publishGameEvent(
    _eventType: string,
    _payload: Record<string, unknown>,
  ): void {}
}
