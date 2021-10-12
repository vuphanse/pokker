import "../imports";
import { ENum } from "../ui/enums";

declare module Template {
    const templateAppStyleGuide: Blaze.Template;
}

module MainApp {
    Template.templateAppStyleGuide.helpers({
        inputOptions: function(): AppUI.UIInputOptions {
            return {
                type: "text",
                value: "Default Input",
                placeholder: "Input placeholder",
                label: "Input lalbel",
                onInputChange: function(value: string): void {
                    console.log("onInputChange: ", value);
                },
            };
        },
        buttonOptions: function(): AppUI.UIButtonOptions {
            return {
                text: "Default",
                style: ENum.EButtonStyle.Small | ENum.EButtonStyle.Success,
                onClick: function(event: Event): void {
                    console.log({event});
                },
            }
        }
    });
}