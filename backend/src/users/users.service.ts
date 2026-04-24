import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOneBy({ email });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOneBy({ username });
  }

  async create(data: {
    username: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  async incrementStats(
    userId: string,
    won: boolean,
  ): Promise<void> {
    await this.usersRepo.increment({ id: userId }, 'gamesPlayed', 1);
    if (won) {
      await this.usersRepo.increment({ id: userId }, 'gamesWon', 1);
    }
  }

  async getLeaderboard(limit = 20): Promise<User[]> {
    return this.usersRepo.find({
      order: { rating: 'DESC' },
      take: limit,
      select: ['id', 'username', 'rating', 'gamesPlayed', 'gamesWon'],
    });
  }
}
