import { ENUMS } from "../../lib/sharedenums";
import { getCards, getNextPlayerToAct, getPot, isFoldedSeatIndex } from "../../lib/tablelogic";
import { DBCollection } from "./../../lib/collections";
import { checkUserAccess } from "./../security/security";

const ranks: string[] = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const suits: string[] = ["s", "c", "d", "h"];

Meteor.startup(function(): void {
    // DBCollection.Tables.remove({});
    // DBCollection.TableHands.remove({});
});

module MainApp {
    const SB = 10;
    const BB = 20;
    const ANTE = 0;

    Meteor.methods({
        createNewTable: function(name: string, numSeats: number): string {
            check(name, String);
            check(numSeats, Number);
            checkUserAccess();

            if (!name.length)
                throw new Meteor.Error(403, "Table must have a name");

            let table: DB.Table = {
                name,
                createdAt: new Date(),
                hostId: this.userId,
                currentPlayers: [],
                settings: {
                    smallBlind: SB,
                    bigBlind: BB,
                    ante: ANTE,
                    numSeats: numSeats,
                },
                status: ENUMS.ETableStatus.Pending,
            };

            let tableId = DBCollection.Tables.insert(table);
            return tableId;
        },
        
        startNewHand: function(tableId: string, sbSeatIndex: number, index?: number): string {
            check(tableId, String);
            check(sbSeatIndex, Number);
            check(index, Match.Optional(Number));
            checkUserAccess();

            let table = checkAccessAndGetTable(tableId);
            if (table.currentPlayers.length < 2)
                throw new Meteor.Error(403, "Not enough players to start a hand, minimum is 2");

            if (isTableInPlayingHand(tableId))
                throw new Meteor.Error(403, "Cannot start new hand if last one is not finished");
            
            if (index === undefined)
                index = DBCollection.TableHands.find({ tableId }).count() + 1;

            let currentPlayers = table.currentPlayers.sort((a, b) => a.seatIndex - b.seatIndex);
            currentPlayers.forEach((p: DB.HandPlayer) => { delete p.isSB; delete p.isBB });

            let hand: DB.TableHand = {
                index,
                tableId,
                players: currentPlayers,
                rounds: [],
                isFinished: false,
            };

            let SBPlayerIndex = hand.players.findIndex(player => player.seatIndex == sbSeatIndex);
            let SBPlayer = hand.players[SBPlayerIndex];
            let BBPlayer = hand.players[SBPlayerIndex + 1];
            if (!BBPlayer)
                BBPlayer = hand.players[0];

            hand.rounds.push({
                type: ENUMS.ETableHandRoundType.Preflop,
                actions: [{
                    actionType: ENUMS.ETableHandRoundActionType.Bet,
                    amount: table.settings.smallBlind,
                    byPlayer: SBPlayer,
                    date: new Date(),
                }, {
                    actionType: ENUMS.ETableHandRoundActionType.Raise,
                    amount: table.settings.bigBlind,
                    byPlayer: BBPlayer,
                    date: new Date(),
                }],
                cards: [],
            });

            SBPlayer.isSB = true;
            SBPlayer.stack -= table.settings.smallBlind;

            BBPlayer.isBB = true;
            BBPlayer.stack -= table.settings.bigBlind;

            return DBCollection.TableHands.insert(hand);
        },

        addPlayerToTable: function(tableId: string, seatIndex: number, name: string, stack: number): void {
            check(tableId, String);
            check(seatIndex, Number);
            check(name, String);
            check(stack, Number);

            let table = checkAccessAndGetTable(tableId);
            if (isTableInPlayingHand(tableId))
                throw new Meteor.Error(403, "Cannot add user while in hand");

            if (!table.currentPlayers)
                table.currentPlayers = [];

            if (table.currentPlayers.find(player => player.seatIndex == seatIndex))
                throw new Meteor.Error(403, "Occupied seat");

            table.currentPlayers.push({
                seatIndex,
                name,
                stack,
            });

            DBCollection.Tables.update({
                _id: tableId,
            }, {
                $set: {
                    currentPlayers: table.currentPlayers.sort((a, b) => a.seatIndex - b.seatIndex),
                },
            });
        },

        removePlayerFromTable: function(tableId: string, seatIndex: number): void {
            check(tableId, String);
            check(seatIndex, Number);
            let table = checkAccessAndGetTable(tableId);

            if (isTableInPlayingHand(tableId))
                throw new Meteor.Error(403, "Cannot remove user while in hand");

            let players = table.currentPlayers.filter(p => p.seatIndex !== seatIndex);

            DBCollection.Tables.update({
                _id: tableId,
            }, {
                $set: {
                    currentPlayers: players,
                },
            });
        },

        addChipToPlayerStack: function(tableId: string, seatIndex: number, addAmount: number): void {
            check(tableId, String);
            check(seatIndex, Number);
            check(addAmount, Number);

            let table = checkAccessAndGetTable(tableId);
            if (isTableInPlayingHand(tableId))
                throw new Meteor.Error(403, "Cannot add chip to player stack while in hand");

            let player = table.currentPlayers.find(p => p.seatIndex == seatIndex);
            player.stack = player.stack + addAmount;

            if (player.stack < 0)
                throw new Meteor.Error("Stack cannot be negative");

            DBCollection.Tables.update({
                _id: tableId,
            }, {
                $set: {
                    currentPlayers: table.currentPlayers,
                },
            });
        },

        startNextRound: function(handId: string): void {
            check(handId, String);
            checkUserAccess();

            let hand = checkAccessAndGetHand(handId);
            let lastRoundType = hand.rounds[hand.rounds.length - 1].type;

            if (lastRoundType == ENUMS.ETableHandRoundType.River)
                throw new Meteor.Error(403, "Cannot start new round on River");

            let nextRoundType: ENUMS.ETableHandRoundType;
            if (lastRoundType == ENUMS.ETableHandRoundType.Preflop)
                nextRoundType = ENUMS.ETableHandRoundType.Flop;
            else if (lastRoundType == ENUMS.ETableHandRoundType.Flop)
                nextRoundType = ENUMS.ETableHandRoundType.Turn;
            else if (lastRoundType == ENUMS.ETableHandRoundType.Turn)
                nextRoundType = ENUMS.ETableHandRoundType.River;

            let round: DB.TableHandRound = {
                type: nextRoundType,
                actions: [],
            };

            hand.rounds.push(round);

            DBCollection.TableHands.update({
                _id: handId,
            }, {
                $set: {
                    rounds: hand.rounds,
                },
            });
        },

        setHandWinner: function(handId: string, seatIndex: number): void {
            check(handId, String);
            let hand = checkAccessAndGetHand(handId);

            if (isFoldedSeatIndex(hand, seatIndex))
                throw new Meteor.Error(403, "Folded seat cannot win hand");
            
            let pot = getPot(hand);
            let player = hand.players.find(player => player.seatIndex == seatIndex);
            player.stack = player.stack + pot;

            DBCollection.TableHands.update({
                _id: handId,
            }, {
                $set: {
                    players: hand.players,
                    winner: player,
                    isFinished: true,
                },
            });

            DBCollection.Tables.update({
                _id: hand.tableId
            }, {
                $set: {
                    currentPlayers: hand.players,
                },
            });
        },

        takeHandRoundAction: function(handId: string, bySeatIndex: number, actionType: ENUMS.ETableHandRoundActionType, amount: number = 0): void {
            check(handId, String);
            check(bySeatIndex, Number);
            check(actionType, Number);
            check(amount, Number);
            checkUserAccess();

            let hand = checkAccessAndGetHand(handId);
            let curentRound = hand.rounds[hand.rounds.length - 1];

            if (!curentRound.actions) {
                curentRound.actions = [];
            } else {
                let lastAction = curentRound.actions[curentRound.actions.length - 1];
                if (lastAction?.byPlayer?.seatIndex == bySeatIndex)
                    throw new Meteor.Error(403, "Already took action");
    
                let nextPlayerToAct = getNextPlayerToAct(hand);
                if (!nextPlayerToAct || nextPlayerToAct.seatIndex !== bySeatIndex)
                    throw new Meteor.Error(403, "Not this seat turn to act");
            }

            let byPlayer = hand.players.find(player => player.seatIndex == bySeatIndex);
            byPlayer.stack -= amount;
            curentRound.actions.push({
                actionType: actionType,
                amount,
                byPlayer,
                date: new Date(),
            });

            DBCollection.TableHands.update({
                _id: handId,
            }, {
                $set: {
                    players: hand.players,
                    rounds: hand.rounds,
                },
            });
        },

        addRoundCards: function(handId: string, cards: string): void {
            check(handId, String);
            check(cards, String);

            let hand = checkAccessAndGetHand(handId);
            let currentRound = hand.rounds[hand.rounds.length - 1];
            if (currentRound.type == ENUMS.ETableHandRoundType.Preflop)
                throw new Meteor.Error(403, "Cannot reveal hand in Preflop");

            let cardsToAdd = cards.trim().split(" ");
            let handCards = getCards(hand);

            cardsToAdd.forEach(function(card: string): void {
                checkCard(card);
                if (handCards.indexOf(card) >= 0)
                    throw new Meteor.Error(403, `Card ${card} is added already`);
            });

            if (currentRound.type === ENUMS.ETableHandRoundType.Flop && cardsToAdd.length !== 3)
                throw new Meteor.Error(403, "Must reveal 3 cards in Flop");

            if (currentRound.type === ENUMS.ETableHandRoundType.Turn && cardsToAdd.length !== 1)
                throw new Meteor.Error(403, "Must reveal 1 cards in Turn");

            if (currentRound.type === ENUMS.ETableHandRoundType.River && cardsToAdd.length !== 1)
                throw new Meteor.Error(403, "Must reveal 1 cards in River");

            if (!currentRound.cards)
                currentRound.cards = [];
                
            currentRound.cards.push(...cardsToAdd);

            DBCollection.TableHands.update({
                _id: handId,
            }, {
                $set: {
                    rounds: hand.rounds,
                },
            });
        },
    });

    function checkCard(card: string): void {
        if (card.length !== 2)
            throw new Meteor.Error(403, "Invalid card length");

        if (ranks.indexOf(card[0]) < 0)
            throw new Meteor.Error(403, "Invalid card rank");

        if (suits.indexOf(card[1]) < 0)
            throw new Meteor.Error(403, "Invalid card suit");
    }

    function isTableInPlayingHand(tableId: string): boolean {
        return !!DBCollection.TableHands.findOne({
            tableId,
            isFinished: false,
        }, {
            sort: { index: - 1 },
        });
    }

    function checkAccessAndGetTable(tableId: string): DB.Table {
        let table = DBCollection.Tables.findOne(tableId);
        if (!table)
            throw new Meteor.Error(403, "Invalid table");

        if (table.hostId !== Meteor.userId())
            throw new Meteor.Error(403, "Only host can add logs for the table");

        return table;
    }

    function checkAccessAndGetHand(handId: string): DB.TableHand {
        let hand = DBCollection.TableHands.findOne(handId);
        if (!hand)
            throw new Meteor.Error(403, "Invalid table");

        checkAccessAndGetTable(hand.tableId);

        return hand;
    }
}