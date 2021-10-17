import { ENUMS } from "../../lib/sharedenums";
import { DBCollection } from "./../../lib/collections";
import { checkUserAccess } from "./../security/security";

Meteor.startup(() => DBCollection.TableHands.remove({}));


module MainApp {
    const SB = 2;
    const BB = 4;
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

            let table = checkAndGetTable(tableId);
            if (table.currentPlayers.length < 2)
                throw new Meteor.Error(403, "Not enough players to start a hand, minimum is 2");

            if (isTableInPlayingHand(tableId))
                throw new Meteor.Error(403, "Cannot start new hand if last one is not finished");
            
            if (index === undefined)
                index = DBCollection.TableHands.find({ tableId }).count() + 1;

            let hand: DB.TableHand = {
                index,
                tableId,
                players: table.currentPlayers,
                rounds: [],
                isFinished: false,
            };

            let SBPlayerIndex = hand.players.findIndex(player => player.seatIndex == sbSeatIndex);
            let SBPlayer = hand.players[SBPlayerIndex];
            let BBPlayer = hand.players[SBPlayerIndex + 1];

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

            let table = checkAndGetTable(tableId);
            if (isTableInPlayingHand(tableId))
                throw new Meteor.Error(403, "Cannot start new hand if last one is not finished");

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

        takeHandRoundAction: function(handId: string, bySeatIndex: number, actionType: ENUMS.ETableHandRoundActionType, amount: number = 0): void {
            check(handId, String);
            check(bySeatIndex, Number);
            check(actionType, Number);
            check(amount, Number);
            checkUserAccess();

            let hand = checkAndGetHand(handId);
            let curentRound = hand.rounds[hand.rounds.length - 1];

            if (!curentRound.actions) {
                curentRound.actions = [];
            } else {
                let lastAction = curentRound.actions[curentRound.actions.length - 1];
                if (lastAction.byPlayer.seatIndex == bySeatIndex)
                    throw new Meteor.Error(403, "Already took action");
    
                let nextPlayerToAct = hand.players.find(player => player.seatIndex > lastAction.byPlayer.seatIndex);
                if (!nextPlayerToAct)
                    hand.players.find(player => player.seatIndex < lastAction.byPlayer.seatIndex);

                if (nextPlayerToAct.seatIndex !== bySeatIndex)
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

            console.log(JSON.stringify({
                players: hand.players,
                rounds: hand.rounds,
            }, null, 4));

            DBCollection.TableHands.update({
                _id: handId,
            }, {
                $set: {
                    players: hand.players,
                    rounds: hand.rounds,
                },
            });
        },
    });

    function isTableInPlayingHand(tableId: string): boolean {
        return !!DBCollection.TableHands.findOne({
            tableId,
            isFinished: false,
        }, {
            sort: { index: - 1 },
        });
    }

    function checkAndGetTable(tableId: string): DB.Table {
        let table = DBCollection.Tables.findOne(tableId);
        if (!table)
            throw new Meteor.Error(403, "Invalid table");

        return table;
    }

    function checkAndGetHand(handId: string): DB.TableHand {
        let hand = DBCollection.TableHands.findOne(handId);
        if (!hand)
            throw new Meteor.Error(403, "Invalid table");

        return hand;
    }
}