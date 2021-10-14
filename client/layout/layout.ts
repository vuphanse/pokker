import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.js";

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