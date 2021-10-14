import "./../imports";

declare module Template {
    const templateAppHeader: Blaze.Template;
}

module MainApp {
    Template.templateAppHeader.events({
        'click .js-home': function(): void {
            Router.go("home");
        },
        'click .js-sign-in': function(): void {
            Router.go("signin");
        },
        'click .js-sign-up': function(): void {
            Router.go("signup");
        },
        'click .js-log-out': function(): void {
            Meteor.logout();
        },
    });
}