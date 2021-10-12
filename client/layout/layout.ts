import "./../imports";

declare module Template {
    const templateAppLayout: Blaze.Template;
}

module App {
    Template.templateAppLayout.helpers({
        thisArray: function(): any[] {
            return [this];
        },
    });
}