import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';

/**
 * Creates a default test account when DEV_LITE=true (local SQLite dev).
 */
@Injectable()
export class DevSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DevSeedService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get<string>('DEV_LITE') !== 'true') return;

    const email =
      this.config.get<string>('SEED_TEST_EMAIL') ?? 'test@coinche.local';
    const username =
      this.config.get<string>('SEED_TEST_USERNAME') ?? 'testplayer';
    const password =
      this.config.get<string>('SEED_TEST_PASSWORD') ?? 'testtest123';

    if (
      (await this.usersService.findByEmail(email)) ||
      (await this.usersService.findByUsername(username))
    ) {
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await this.usersService.create({ username, email, passwordHash });
    this.logger.log(
      `DEV_LITE test user created — email: ${email}  password: ${password}`,
    );
  }
}
