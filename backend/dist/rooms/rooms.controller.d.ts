import { RoomsService } from './rooms.service';
export declare class RoomsController {
    private readonly roomsService;
    constructor(roomsService: RoomsService);
    create(req: any): Promise<import("../common/types").RoomState>;
    getRoom(id: string): Promise<import("../common/types").RoomState | null>;
    joinByCode(code: string, req: any): Promise<import("../common/types").RoomState>;
}
