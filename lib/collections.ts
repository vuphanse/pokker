/// <reference path="../definitions/index.d.ts"/>

export module DBCollection {
    export const Tables = new Mongo.Collection<DB.Table>("tables");
    export const TableHands = new Mongo.Collection<DB.TableHand>("tablehands");
}