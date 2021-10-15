declare module DB {
    export enum ETableStatus {
        Pending = 0,
        Playing = 1,
        Closed  = 2,
    }

    export enum ETableHandRoundType {
        Preflop = 0,
        Flop    = 1,
        Turn    = 2,
        River   = 3,
    }

    export enum ETableHandRoundActionType {
        Fold    = 0,
        Check   = 1,
        Bet     = 2,
        Raise   = 3,
        Call    = 4,
        AllIn   = 5,
    }

    export interface Table {
        _id?: string;
        name: string;
        createdAt: Date;
        hostId: string;
        settings: TableSettings;
        currentPlayers: Player[];
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
        name?: string;
        stack?: number;
        seatIndex?: number;
    }

    export interface HandPlayer extends Player {
        isSB?: boolean;
        isBB?: boolean;
    }

    export interface TableHand {
        _id?: string;
        index: number;
        tableId: string;
        players: HandPlayer[];
        rounds?: TableHandRound[];
        isFinished: boolean;
        winner?: HandPlayer;
        cards?: string[];
    }

    export interface TableHandRound {
        type: ETableHandRoundType;
        actions?: TableHandRoundAction[];
        cards?: string[];
    }

    export interface TableHandRoundAction {
        actionType: ETableHandRoundActionType;
        amount?: number;
        byPlayer: HandPlayer;
        date: Date;
    }
}