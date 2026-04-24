export declare class GameHistory {
    id: string;
    roomCode: string;
    teamA: {
        id: string;
        username: string;
    }[];
    teamB: {
        id: string;
        username: string;
    }[];
    teamAScore: number;
    teamBScore: number;
    winner: 'teamA' | 'teamB';
    totalRounds: number;
    roundDetails: {
        contract: {
            team: string;
            suit: string;
            value: number;
        };
        teamAScore: number;
        teamBScore: number;
        capot: boolean;
    }[];
    durationSeconds: number;
    playedAt: Date;
}
