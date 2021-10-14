import { ENUMS } from "../../lib/sharedenums";
import { DBCollection } from "./../../lib/collections";
import { checkUserAccess } from "./../security/security";

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
                players: [],
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
    });
}