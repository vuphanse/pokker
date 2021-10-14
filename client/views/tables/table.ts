import { DBCollection } from "../../../lib/collections";
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
        seats: function(this: DB.Table): HandSeat[] {
            let tpl = <TemplateTableInstance>Template.instance();
            let hand = getCurrentHand(tpl);

            if (!hand) {
                let seats: HandSeat[] = [];
                for (let i = 0; i < this.settings.numSeats; i++) {
                    let currentPlayers = this.currentPlayers;
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

                return seats;
            }

            return hand.players.map(function(player: DB.HandPlayer): HandSeat {
                return {
                    ...player,
                    tableId: tpl.data._id,
                };
            });
        },
        currentHand: function(): DB.TableHand {
            let tpl = <TemplateTableInstance>Template.instance();
            return getCurrentHand(tpl);
        },
    });

    function getCurrentHand(tpl: TemplateTableInstance): DB.TableHand {
        return DBCollection.TableHands.findOne(tpl.currentHandId.get());
    }

    Template.templateTableSeat.helpers({
        addPlayerBtnOptions: function(this: HandSeat): AppUI.UIButtonOptions {
            let self = this;
            return {
                text: "Take seat",
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