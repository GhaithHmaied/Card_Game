import { OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
export declare class DevSeedService implements OnApplicationBootstrap {
    private readonly config;
    private readonly usersService;
    private readonly logger;
    constructor(config: ConfigService, usersService: UsersService);
    onApplicationBootstrap(): Promise<void>;
}
