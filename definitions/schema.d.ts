declare module DB {
    export enum ETableStatus {
        Active,
        Closed,
    }

    export interface Table {
        _id: string;
        name: string;
        createdAt: Date;
        hostId: string;
        settings: TableSettings;
        players: Player[];
        status: ETableStatus;
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