import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UsersService {
    private readonly usersRepo;
    constructor(usersRepo: Repository<User>);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    create(data: {
        username: string;
        email: string;
        passwordHash: string;
    }): Promise<User>;
    incrementStats(userId: string, won: boolean): Promise<void>;
    getLeaderboard(limit?: number): Promise<User[]>;
}
