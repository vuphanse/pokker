// Copy every enum defined in client/server code here;

export module ENUMS {
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
    }
}