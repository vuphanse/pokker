import { DBCollection } from "../../../lib/collections";
import { ENUMS } from "../../../lib/sharedenums";
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
    }

    interface HandSeat extends DB.HandPlayer {
        isEmpty?: boolean;
        tableId: string;
    }

    Template.templateTable.onCreated(function(this: TemplateTableInstance): void {
        let self = this;

        self.sbSeatIndex = new ReactiveVar(0);
        self.currentHandId = new ReactiveVar(null);
        self.subscribe("subscribeTableHands", self.data._id);
    });

    Template.templateTable.helpers({
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
            let secondRow = seats.splice(index + 1, seats.length);
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
            let pot = 0;
            
            for (let round of currentHand.rounds) {
                for (let action of round.actions) {
                    switch (action.actionType) {
                        case ENUMS.ETableHandRoundActionType.Bet:
                        case ENUMS.ETableHandRoundActionType.Call:
                        case ENUMS.ETableHandRoundActionType.Raise: {
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
        },
    });

    function getCurrentHand(tpl: TemplateTableInstance): DB.TableHand {
        return DBCollection.TableHands.findOne(tpl.currentHandId.get());
    }

    function getSeats(tpl: TemplateTableInstance): HandSeat[] {
        let hand = getCurrentHand(tpl);
        let seats: HandSeat[] = [];

        if (!hand) {
            for (let i = 0; i < tpl.data.settings.numSeats; i++) {
                let currentPlayers = tpl.data.currentPlayers;
                let seat = currentPlayers && currentPlayers.find(p => p.seatIndex == i);
                if (seat) {
                    seats.push({...seat, tableId: tpl.data._id});
                    continue;
                }

                seats.push({
                    seatIndex: i,
                    isEmpty: true,
                    tableId: tpl.data._id,
                });
            }
        } else {
            seats = hand.players.map(function(player: DB.HandPlayer): HandSeat {
                return {
                    ...player,
                    tableId: tpl.data._id,
                };
            });
        }

        return seats;
    }

    function startHand(tpl: TemplateTableInstance): void {
        let lastSBIndex = tpl.sbSeatIndex.get();

        Meteor.call("startNewHand", tpl.data._id, lastSBIndex + 1, function(error: Meteor.Error, handId: string): void {
            if (error) {
                console.log({error});
                return;
            }

            tpl.sbSeatIndex.set(lastSBIndex + 1);
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
                text: `Take seat ${self.seatIndex}`,
                style: ENum.EButtonStyle.Primary,
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
    });
}