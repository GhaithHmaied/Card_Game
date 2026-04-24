import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { QueueService } from './queue.service';
import { RABBITMQ_CLIENT } from './queue.constants';
import { NoopQueueService } from './noop-queue.service';

@Global()
@Module({})
export class QueueModule {
  static forRoot(lite: boolean): DynamicModule {
    if (lite) {
      return {
        module: QueueModule,
        providers: [{ provide: QueueService, useClass: NoopQueueService }],
        exports: [QueueService],
      };
    }
    return {
      module: QueueModule,
      imports: [
        ConfigModule,
        ClientsModule.registerAsync([
          {
            name: RABBITMQ_CLIENT,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [
                  config.get<string>('RABBITMQ_URL') ??
                    'amqp://guest:guest@localhost:5672',
                ],
                queue: 'coinche_game_events',
                queueOptions: { durable: true },
              },
            }),
          },
        ]),
      ],
      providers: [QueueService],
      exports: [QueueService],
    };
  }
}
