import { HistoryService } from './history.service';
export declare class HistoryController {
    private readonly historyService;
    constructor(historyService: HistoryService);
    getMyHistory(req: any, limit?: string): Promise<import("./game-history.entity").GameHistory[]>;
}
