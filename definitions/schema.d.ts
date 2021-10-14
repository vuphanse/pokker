declare module DB {
    export enum ETableStatus {
        Pending = 0,
        Playing = 1,
        Closed  = 2,
    }

    export interface Table {
        _id?: string;
        name: string;
        createdAt: Date;
        hostId: string;
        settings: TableSettings;
        players: Player[];
        status: number;
    }
    
    export interface TableSettings {
        numSeats: number;
        smallBlind: number;
        bigBlind: number;
        ante?: number;
    }
    
    export interface Player {
        _id?: string;
        name: string;
        stack: number;
    }
}