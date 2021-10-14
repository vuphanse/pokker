import "./imports";
import { UIPopup } from "./popup";

declare module Template {
    const templateMainApp: Blaze.Template;
}

module MainApp {
    Template.templateMainApp.onCreated(function(this: Blaze.TemplateInstance): void {
    });

    Template.templateMainApp.onRendered(function(this: Blaze.TemplateInstance): void {
        
    });

    Template.templateMainApp.onDestroyed(function(this: Blaze.TemplateInstance): void {
    });

    Template.templateMainApp.helpers({
        title: function(): string {
            return "Welcome to the game";
        },
    });

    Template.templateMainApp.events({

    });
}