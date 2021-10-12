import "./../imports";

declare module Template {
    const templateAppLayout: Blaze.Template;
}

module MainApp {
    Template.templateAppLayout.helpers({
        thisArray: function(): any[] {
            return [this];
        },
    });
}