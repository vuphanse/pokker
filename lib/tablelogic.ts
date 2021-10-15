import { ENUMS } from "./sharedenums";

export function getNextPlayerToAct(hand: DB.TableHand): DB.HandPlayer {
    if (!hand.rounds.length)
        return null;

        let ableToActPlayers = hand.players.sort((a, b) => a.seatIndex - b.seatIndex)
            .filter(p => p.stack > 0 && !isFoldedSeatIndex(hand, p.seatIndex) && !isAllInSeatIndex(hand, p.seatIndex));
        let currentRound = hand.rounds[hand.rounds.length - 1];
        let actions = currentRound.actions;
        if (!actions.length)
            return (ableToActPlayers.find(p => p.isSB) || ableToActPlayers[0]);

        let lastAction = actions[actions.length - 1];
        let lastActPlayer = lastAction.byPlayer;
        let nextPlayer = ableToActPlayers.find(player => player.seatIndex > lastActPlayer.seatIndex);
        if (!nextPlayer)
            nextPlayer = ableToActPlayers.find(player => player.seatIndex < lastActPlayer.seatIndex);

    if (nextPlayer)
        return nextPlayer;
}

export function isFoldedSeatIndex(hand: DB.TableHand, seatIndex: number): boolean {
    for (let round of hand.rounds) {
        for (let action of round.actions) {
            if (action.actionType == ENUMS.ETableHandRoundActionType.Fold && seatIndex == action.byPlayer.seatIndex)
                return true;
        }
    }

    return false;
}

export function isAllInSeatIndex(hand: DB.TableHand, seatIndex: number): boolean {
    for (let round of hand.rounds) {
        for (let action of round.actions) {
            if (action.actionType == ENUMS.ETableHandRoundActionType.AllIn && seatIndex == action.byPlayer.seatIndex)
                return true;
        }
    }

    return false;
}

export function getPutInMoneyByOfSeatOnRound(hand: DB.TableHand, seatIndex: number, roundType: ENUMS.ETableHandRoundType): number {
    let round = hand.rounds.find(round => round.type == roundType);
    return round.actions.filter(action => action.byPlayer.seatIndex == seatIndex).reduce((total, current) => total + current.amount, 0);
};

export function getPot(hand: DB.TableHand): number {
    let pot = 0;
    for (let round of hand.rounds) {
        for (let action of round.actions) {
            switch (action.actionType) {
                case ENUMS.ETableHandRoundActionType.Bet:
                case ENUMS.ETableHandRoundActionType.Call:
                case ENUMS.ETableHandRoundActionType.Raise:
                case ENUMS.ETableHandRoundActionType.AllIn: {
                    pot += action.amount;
                    break;
                }
                default: {
                    break;
                }
            }
        }
    }

    return pot;
}

export function getCards(hand: DB.TableHand): string[] {
    let cards: string[] = [];
    for (let round of hand.rounds)
        cards.push(...(round.cards || []));

    return cards;
}