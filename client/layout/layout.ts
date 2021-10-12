/// <reference path="../../definitions/index.d.ts"/>

import { Templates } from "./../templates";

Template[Templates.layout].helpers({
    thisArray: function(): any[] {
        return [this];
    },
});