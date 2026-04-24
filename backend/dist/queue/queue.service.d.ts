import { ClientProxy } from '@nestjs/microservices';
export declare class QueueService {
    private readonly client;
    constructor(client: ClientProxy);
    onModuleInit(): Promise<void>;
    emit(pattern: string, data: any): void;
    publishGameEvent(eventType: string, payload: Record<string, any>): void;
}
