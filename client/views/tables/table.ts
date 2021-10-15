import { DBCollection } from "../../../lib/collections";
import { ENUMS } from "../../../lib/sharedenums";
import { getCards, getNextPlayerToAct, getPot, getPutInMoneyByOfSeatOnRound, isFoldedSeatIndex } from "../../../lib/tablelogic";
import { ENum } from "../../ui/enums";
import { UIPopup } from "../../ui/popup";

module MainApp {
    Template.templateTableWrapper.onCreated(function(): void {
        this.subscribe("subscribeTable", this.data.tableId);
    });

    Template.templateTableWrapper.helpers({
        tableData: function(this: any): DB.Table {
            return DBCollection.Tables.findOne(this.tableId);
        },
    });

    interface TemplateTableInstance extends Blaze.TemplateInstance {
        data: DB.Table;
        currentHandId: ReactiveVar<string>;
        sbSeatIndex: ReactiveVar<number>;
        nextPlayerToActSeatIndex: ReactiveVar<number>;
        nextActionAmount: ReactiveVar<number>;
        cardsInput: ReactiveVar<string>;
    }

    interface HandSeat extends DB.HandPlayer {
        isEmpty?: boolean;
        tableId: string;
        nextToAct?: boolean;
        totalOnRound?: number;
        folded?: boolean;
        handId?: string;
        editable?: boolean;
    }

    Template.templateTable.onCreated(function(this: TemplateTableInstance): void {
        let self = this;

        self.sbSeatIndex = new ReactiveVar(0);
        self.currentHandId = new ReactiveVar(null);
        self.nextPlayerToActSeatIndex = new ReactiveVar(null);
        self.nextActionAmount = new ReactiveVar(0);
        self.cardsInput = new ReactiveVar("");
        self.subscribe("subscribeTableHands", self.data._id);

        self.autorun(function(): void {
            let lastFinishedHand = DBCollection.TableHands.findOne({
                tableId: self.data._id,
                isFinished: true,
            }, {
                sort: {
                    index: -1,
                },
            });

            if (lastFinishedHand) {
                let lastSBSeatIndex = lastFinishedHand.players.find(p => p.isSB).seatIndex;
                let sortedPlayers = self.data.currentPlayers.sort((a, b) => a.seatIndex - b.seatIndex);
                let nextSB = sortedPlayers.find(p => p.seatIndex > lastSBSeatIndex);
                if (!nextSB)
                    nextSB = sortedPlayers[0];

                self.sbSeatIndex.set(nextSB.seatIndex);
            }
        });

        self.autorun(function(): void {
            let lastNotFinishedHand = DBCollection.TableHands.findOne({
                isFinished: false,
                tableId: self.data._id,
            }, {
                fields: {
                    _id: 1,
                },
            });

            if (lastNotFinishedHand)
                self.currentHandId.set(lastNotFinishedHand._id);
            else
                self.currentHandId.set(null);
        });

        self.autorun(function(): void {
            let currentHand = getCurrentHand(self);
            if (!currentHand)
                return;

            let nextToActPlayer = getNextPlayerToAct(currentHand);
            if (nextToActPlayer)
                self.nextPlayerToActSeatIndex.set(nextToActPlayer.seatIndex);
        });
    });

    Template.templateTable.helpers({
        nextToActPlayer: function(): DB.HandPlayer {
            let tpl = <TemplateTableInstance>Template.instance();
            let currentHand = getCurrentHand(tpl);
            if (!currentHand)
                return;

            return currentHand.players.find(p => p.seatIndex == tpl.nextPlayerToActSeatIndex.get());
        },
        handsToLog: function(this: DB.Table): Mongo.Cursor<DB.TableHand> {
            return DBCollection.TableHands.find({
                tableId: this._id,
            }, {
                sort: {
                    index: -1,
                },
            });
        },
        round: function(this: DB.Table): string {
            let tpl = <TemplateTableInstance>Template.instance();
            let currentHand = getCurrentHand(tpl);
            if (!currentHand)
                return;

            let round = currentHand.rounds[currentHand.rounds.length - 1];

            switch (round.type) {
                case ENUMS.ETableHandRoundType.Preflop: return "Pre-flop";
                case ENUMS.ETableHandRoundType.Flop: return "Flop";
                case ENUMS.ETableHandRoundType.Turn: return "Turn";
                case ENUMS.ETableHandRoundType.River: return "River";
            };
        },
        handIndex: function(this: DB.Table): string {
            let currentHand = DBCollection.TableHands.findOne({ tableId: this._id }, {
                sort: {
                    index: -1,
                },
            });

            if (!currentHand)
                return "Hand #1";

            return `Hand #${currentHand.index}`;
        },
        firstRowSeats: function(this: DB.Table): HandSeat[] {
            let tpl = <TemplateTableInstance>Template.instance();
            let seats = getSeats(tpl);

            let index = Math.round(seats.length / 2);
            let firstRow = seats.slice(0, index);

            return firstRow;
        },
        secondRowSeats: function(this: DB.Table): HandSeat[] {
            let tpl = <TemplateTableInstance>Template.instance();
            let seats = getSeats(tpl);

            let index = Math.round(seats.length / 2);
            let secondRow = seats.splice(index, seats.length);
            
            return secondRow;
        },
        currentHand: function(): DB.TableHand {
            let tpl = <TemplateTableInstance>Template.instance();
            return getCurrentHand(tpl);
        },
        newHandBtnOptions: function(this: DB.Table): AppUI.UIButtonOptions {
            if (!isEditable(this))
                return;
                
            let tpl = <TemplateTableInstance>Template.instance();
            return {
                text: "Start new hand",
                onClick: function(): void {
                    startHand(tpl);
                },
                style: ENum.EButtonStyle.Large | ENum.EButtonStyle.Warning,
            };
        },
        pot: function(): number {
            let tpl = <TemplateTableInstance>Template.instance();
            let currentHand = getCurrentHand(tpl);

            return getPot(currentHand);
        },
        isEditable: function(this: DB.Table): boolean {
            return isEditable(this);
        },
        foldBtnOption: function(this: DB.Table): AppUI.UIButtonOptions {
            let tpl = <TemplateTableInstance>Template.instance();
            return {
                text: "Fold",
                identifierClasses: "js-fold-btn fold-btn",
                onClick: function(): void {
                    takeRoundAction(tpl, ENUMS.ETableHandRoundActionType.Fold, 0);
                },
                style: ENum.EButtonStyle.Danger | ENum.EButtonStyle.Medium,
            };
        },
        checkBtnOptions: function(this: DB.Table): AppUI.UIButtonOptions {
            let tpl = <TemplateTableInstance>Template.instance();
            return {
                text: "Check",
                identifierClasses: "js-check-btn check-btn",
                onClick: function(): void {
                    takeRoundAction(tpl, ENUMS.ETableHandRoundActionType.Check, 0);
                },
                style: ENum.EButtonStyle.Default | ENum.EButtonStyle.Medium,
            };
        },
        callBtnOptions: function(this: DB.Table): AppUI.UIButtonOptions {
            let tpl = <TemplateTableInstance>Template.instance();
            return {
                text: "Call",
                identifierClasses: "js-call-btn call-btn",
                onClick: function(): void {
                    takeRoundAction(tpl, ENUMS.ETableHandRoundActionType.Call, getCallAmount(tpl));
                },
                style: ENum.EButtonStyle.Success | ENum.EButtonStyle.Medium,
            };
        },
        amountInputOptions: function(this: DB.Table): AppUI.UIInputOptions {
            let tpl = <TemplateTableInstance>Template.instance();
            return {
                type: "number",
                value: tpl.nextActionAmount.get() + "",
                onInputChange: value => tpl.nextActionAmount.set(parseInt(value) || 0),
            };
        },
        betBtnOptions: function(this: DB.Table): AppUI.UIButtonOptions {
            let tpl = <TemplateTableInstance>Template.instance();
            return {
                text: "Bet",
                identifierClasses: "js-bet-btn bet-btn",
                onClick: function(): void {
                    takeRoundAction(tpl, ENUMS.ETableHandRoundActionType.Bet, tpl.nextActionAmount.get());
                    tpl.nextActionAmount.set(0);
                },
                style: ENum.EButtonStyle.Warning | ENum.EButtonStyle.Medium,
            };
        },
        raiseBtnOptions: function(this: DB.Table): AppUI.UIButtonOptions {
            let tpl = <TemplateTableInstance>Template.instance();
            return {
                text: "Raise",
                identifierClasses: "js-raise-btn raise-btn",
                onClick: function(): void {
                    takeRoundAction(tpl, ENUMS.ETableHandRoundActionType.Raise, tpl.nextActionAmount.get());
                    tpl.nextActionAmount.set(0);
                },
                style: ENum.EButtonStyle.Warning | ENum.EButtonStyle.Medium,
            };
        },
        allInBtnOptions: function(this: DB.Table): AppUI.UIButtonOptions {
            let tpl = <TemplateTableInstance>Template.instance();
            return {
                text: "All in",
                identifierClasses: "js-allin-btn allin-btn",
                onClick: function(): void {
                    let stack = getCurrentHand(tpl).players.find(p => p.seatIndex == tpl.nextPlayerToActSeatIndex.get()).stack;
                    takeRoundAction(tpl, ENUMS.ETableHandRoundActionType.AllIn, stack);
                    tpl.nextActionAmount.set(0);
                },
                style: ENum.EButtonStyle.Danger | ENum.EButtonStyle.Large,
            };
        },
        startNextRoundBtnOptions: function(this: DB.Table): AppUI.UIButtonOptions {
            let tpl = <TemplateTableInstance>Template.instance();
            return {
                text: "To next round",
                identifierClasses: "js-tonextround-btn nextround-btn",
                onClick: function(): void {
                    Meteor.call("startNextRound", tpl.currentHandId.get(), function(error: Meteor.Error): void {
                        if (error) {
                            alert("Cannot go to next round, reason: " + error.reason);
                        }
                    });
                },
                style: ENum.EButtonStyle.Dark | ENum.EButtonStyle.Large,
            };
        },

        addCardsInputOptions: function(): AppUI.UIInputOptions {
            let tpl = <TemplateTableInstance>Template.instance();
            return {
                type: "text",
                onInputChange: value => tpl.cardsInput.set(value),
                value: tpl.cardsInput.get(),
                label: "Cards",
            };
        },
        addCardsBtnOptions: function(this: DB.Table): AppUI.UIButtonOptions {
            let tpl = <TemplateTableInstance>Template.instance();
            return {
                text: "Add cards",
                onClick: function(): void {
                    addCards(tpl);
                },
                style: ENum.EButtonStyle.Default | ENum.EButtonStyle.Medium,
            };
        },
        cards: function(this: DB.Table): string[] {
            let tpl = <TemplateTableInstance>Template.instance();
            let hand = getCurrentHand(tpl);
            return getCards(hand);
        },
    });

    function addCards(tpl: TemplateTableInstance): void {
        let currentHand = getCurrentHand(tpl);
        if (!currentHand)
            return;

        Meteor.call("addRoundCards", currentHand._id, tpl.cardsInput.get(), function(error: Meteor.Error): void {
            if (error) {
                alert("Cannot add cards, reason: " + error.reason);
                return;
            }

            tpl.cardsInput.set("");
        });
    }

    function takeRoundAction(tpl: TemplateTableInstance, action: ENUMS.ETableHandRoundActionType, amount: number): void {
        Meteor.call("takeHandRoundAction", tpl.currentHandId.get(), tpl.nextPlayerToActSeatIndex.get(), action, amount, function(error: Meteor.Error): void {
            if (error) {
                alert("Cannot take this action, reason: " + error.reason);
            }
        });
    }

    function getCallAmount(tpl: TemplateTableInstance): number {
        let hand = getCurrentHand(tpl);
        let activePlayers = hand.players.filter(p => !isFoldedSeatIndex(hand, p.seatIndex));
        let moneyOnRoundMapBySeatIndex: Map<number, number>  = new Map();
        let currentRound = hand.rounds[hand.rounds.length - 1];
        let maxAmount = 0;

        activePlayers.forEach(function(player: DB.HandPlayer): void {
            let amount = getPutInMoneyByOfSeatOnRound(hand, player.seatIndex, currentRound.type);
            moneyOnRoundMapBySeatIndex.set(player.seatIndex, amount);

            if (amount > maxAmount)
                maxAmount = amount;
        });

        let nextToActSeatIndex = tpl.nextPlayerToActSeatIndex.get();
        let nextToActPlayerMoneyInOnRound = moneyOnRoundMapBySeatIndex.get(nextToActSeatIndex);
        return Math.max(Math.min(maxAmount - nextToActPlayerMoneyInOnRound, getPlayerStack(hand, nextToActSeatIndex)), 0);
    }

    function getPlayerStack(hand: DB.TableHand, seatIndex: number): number {
        return hand.players.find(p => p.seatIndex == seatIndex).stack
    }

    function getCurrentHand(tpl: TemplateTableInstance): DB.TableHand {
        return DBCollection.TableHands.findOne(tpl.currentHandId.get());
    }

    function getSeats(tpl: TemplateTableInstance): HandSeat[] {
        let hand = getCurrentHand(tpl);
        let seats: HandSeat[] = [];
        let editable = isEditable(tpl.data);

        if (!hand) {
            let lastIsSB = false;
            for (let i = 0; i < tpl.data.settings.numSeats; i++) {
                let currentPlayers = tpl.data.currentPlayers;
                currentPlayers.forEach((p: DB.HandPlayer) => { delete p.isSB; delete p.isBB });
                let seat = currentPlayers && currentPlayers.find(p => p.seatIndex == i) as DB.HandPlayer;

                if (seat) {
                    let isSB = i == tpl.sbSeatIndex.get();
                    let newSeat: HandSeat = { ...seat, tableId: tpl.data._id, editable };
                    if (isSB) {
                        lastIsSB = true;
                        newSeat.isSB = true;
                    };

                    if (!isSB && lastIsSB) {
                        newSeat.isBB = true;
                        lastIsSB = undefined;
                    }
                    
                    seats.push(newSeat);
                    continue;
                }

                seats.push({
                    seatIndex: i,
                    isEmpty: true,
                    tableId: tpl.data._id,
                    editable,
                });
            }
        } else {
            let round = hand.rounds[hand.rounds.length - 1];
            seats = hand.players.map(function(player: DB.HandPlayer): HandSeat {
                return {
                    ...player,
                    tableId: tpl.data._id,
                    nextToAct: player.seatIndex == tpl.nextPlayerToActSeatIndex.get(),
                    totalOnRound: getPutInMoneyByOfSeatOnRound(hand, player.seatIndex, round.type),
                    folded: isFoldedSeatIndex(hand, player.seatIndex),
                    handId: tpl.currentHandId.get(),
                    editable,
                };
            });
        }

        return seats;
    }

    function startHand(tpl: TemplateTableInstance): void {
        let lastSBIndex = tpl.sbSeatIndex.get();

        Meteor.call("startNewHand", tpl.data._id, lastSBIndex, function(error: Meteor.Error, handId: string): void {
            if (error) {
                alert("Cannot start new hand, reason:" + error.reason);
                return;
            }

            tpl.currentHandId.set(handId);
        });
    }

    function isEditable(table: DB.Table): boolean {
        return table.hostId == Meteor.userId();
    }

    Template.templateTableSeat.helpers({
        addPlayerBtnOptions: function(this: HandSeat): AppUI.UIButtonOptions {
            let self = this;
            return {
                text: `Take seat #${self.seatIndex}`,
                style: ENum.EButtonStyle.Primary | ENum.EButtonStyle.Small,
                onClick: function(): void {
                    UIPopup.show({
                        customData: {
                            tableId: self.tableId,
                            seatIndex: self.seatIndex,
                        },
                        customTemplate: "templateAddPlayerToTable",
                        title: `Take seat #${self.seatIndex}`,
                        modClasses: "add-player-popup",
                    });
                },
            };
        },
        setWinnerBtnOptions: function(this: HandSeat): AppUI.UIButtonOptions {
            if (!this.handId)
                return;

            let self = this;

            return {
                modClasses: "setwinner-btn " + (self.folded ? "" : "mod-visible"),
                text: `Winner`,
                style: ENum.EButtonStyle.Success | ENum.EButtonStyle.Small,
                onClick: function(): void {
                    let confirmed;
                    confirmed = confirm("Are you sure to set this player as winner of this hand?");
                    if (confirmed)
                        setWinner(self.handId, self.seatIndex);
                },
            };
        },
        leaveBtnOptions: function(this: HandSeat): AppUI.UIButtonOptions {
            if (this.handId)
                return;

            let self = this;

            return {
                modClasses: "leave-btn",
                text: `Leave`,
                style: ENum.EButtonStyle.Danger | ENum.EButtonStyle.Small,
                onClick: function(): void {
                    let confirmed;
                    confirmed = confirm("Are you sure to remove this player?");
                    if (confirmed)
                        removePlayerFromTable(self.tableId, self.seatIndex);
                },
            };
        },
        editStackBtnOptions: function(this: HandSeat): AppUI.UIButtonOptions {
            if (this.handId)
                return;

            let self = this;

            return {
                modClasses: "editstack-btn",
                text: `Stack`,
                style: ENum.EButtonStyle.Primary | ENum.EButtonStyle.Small,
                onClick: function(): void {
                    UIPopup.show({
                        customData: {
                            tableId: self.tableId,
                            seatIndex: self.seatIndex,
                        },
                        customTemplate: "templateEditPlayerStack",
                        title: `Edit #${self.seatIndex} stack`,
                        modClasses: "add-player-popup",
                    });
                },
            };
        }
    });

    function setWinner(handId: string, seatIndex: number): void {
        Meteor.call("setHandWinner", handId, seatIndex, function(error: Meteor.Error): void {
            if (error) {
                alert("Cannot set as winner, reason: " + handId);
            }
        });
    }

    function removePlayerFromTable(tableId: string, seatIndex: number): void {
        Meteor.call("removePlayerFromTable", tableId, seatIndex, function(error: Meteor.Error): void {
            if (error) {
                alert("Cannot remove player, reason: " + error.reason);
            }
        });
    }
}