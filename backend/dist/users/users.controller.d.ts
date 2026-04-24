import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
        id: string;
        username: string;
        email: string;
        gamesPlayed: number;
        gamesWon: number;
        rating: number;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    getLeaderboard(): Promise<import("./user.entity").User[]>;
}
