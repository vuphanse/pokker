import { ENUMS } from "../../lib/sharedenums";
import { DBCollection } from "./../../lib/collections";

module MainApp {
    Meteor.publish("subscribeTables", function(limit: number): any {
        check(limit, Number);

        return DBCollection.Tables.find({
            status: { $in: [ENUMS.ETableStatus.Pending, ENUMS.ETableStatus.Playing]},
        }, {
            limit,
            sort: {
                createdAt: -1,
            },
        });
    });

    Meteor.publish("subscribeTable", function(tableId: string): any {
        check(tableId, String);

        return DBCollection.Tables.find({
            _id: tableId,
            status: { $in: [ENUMS.ETableStatus.Pending, ENUMS.ETableStatus.Playing] },
        });
    });

    Meteor.publish("subscribeTableHands", function(tableId: string): any {
        check(tableId, String);

        return DBCollection.TableHands.find({
            tableId: tableId,
        }, {
            sort: { index: -1 },
        });
    });
}