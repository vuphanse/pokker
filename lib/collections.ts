/// <reference path="../definitions/index.d.ts"/>

export module MainApp {
    export const Collection_Tables = new Mongo.Collection<DB.Table>("tables");
}