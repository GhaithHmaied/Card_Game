import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    register(username: string, email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        username: string;
    }>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        username: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        username: string;
    }>;
    validateWsToken(token: string): Promise<{
        sub: string;
        username: string;
    }>;
    private generateTokens;
}
