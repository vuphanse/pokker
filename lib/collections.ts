/// <reference path="../definitions/index.d.ts"/>

export module App {
    export const Collection_Tables = new Mongo.Collection<DB.Table>("tables");
}