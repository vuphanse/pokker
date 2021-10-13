import { ENUMS } from "../../lib/sharedenums";
import { DBCollection } from "./../../lib/collections";

module MainApp {
    Meteor.publish("subscribeTables", function(limit: number): any {
        check(limit, Number);

        return DBCollection.Tables.find({
            status: ENUMS.ETableStatus.Active,
        }, {
            limit,
            sort: {
                createdAt: -1,
            },
        });
    });
}