/// <reference path="../definitions/index.d.ts"/>

Router.configure({
    layoutTemplate: "templateAppLayout",
    loadingTemplate: "templateAppLoading",
});

Router.route("/", {
    name: "home",
    action: function(this: Iron.RouteController): void {
        let self = this;
        self.render("templateMainApp");
    },
});

Router.route("/styleguide", {
    name: "styleguide",
    action: function(this: Iron.RouteController): void {
        let self = this;
        self.render("templateAppStyleGuide");
    },
});