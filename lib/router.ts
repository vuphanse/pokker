/// <reference path="../definitions/index.d.ts"/>

import { AuthRouter } from "./router-auth";

Router.configure({
    layoutTemplate: "templateAppLayout",
    loadingTemplate: "templateAppLoading",
    notFoundTemplate: "templateAppNotFound",
});

Router.onBeforeAction(function(): void {
    let userId = Meteor.userId();

    if (userId)
        return this.next();

    AuthRouter.login(this.route.path() == "/signup");
    this.next();
}, {
    except: ["table", "styleguide"],
});

Router.route("/", {
    name: "home",
    action: function(this: Iron.RouteController): void {
        let self = this;
        self.render("templateMainApp");
    },
});

Router.route("/table/:tableId", {
    name: "table",
    action: function(this: Iron.RouteController): void {
        let self = this;
        self.render("templateTable");
    },
});

Router.route("/styleguide", {
    name: "styleguide",
    action: function(this: Iron.RouteController): void {
        let self = this;
        self.render("templateAppStyleGuide");
    },
});