import { OnModuleInit } from '@nestjs/common';
export declare class NoopQueueService implements OnModuleInit {
    private readonly log;
    onModuleInit(): void;
    emit(_pattern: string, _data: unknown): void;
    publishGameEvent(_eventType: string, _payload: Record<string, unknown>): void;
}
