import { UIPopup } from "../../ui/popup";

module MainApp {
    interface AddPlayerOptions {
        tableId: string;
        seatIndex: number;
    }

    interface TemplateAddPlayerToTableInstance extends Blaze.TemplateInstance {
        data: AddPlayerOptions;
        name: ReactiveVar<string>;
        stack: ReactiveVar<number>;
    }

    Template.templateAddPlayerToTable.onCreated(function(this: TemplateAddPlayerToTableInstance): void {
        this.name = new ReactiveVar("");
        this.stack = new ReactiveVar(0);
    });

    Template.templateAddPlayerToTable.helpers({
        playerNameInputOptions: function(): AppUI.UIInputOptions {
            let tpl = <TemplateAddPlayerToTableInstance>Template.instance();
            return {
                type: "text",
                onInputChange: value => tpl.name.set(value),
                label: "Player name",
                value: tpl.name.get(),
            };
        },
        stackInputOptions: function(): AppUI.UIInputOptions {
            let tpl = <TemplateAddPlayerToTableInstance>Template.instance();
            return {
                type: "number",
                onInputChange: value => tpl.stack.set(parseInt(value) || 0),
                label: "Stack",
                value: tpl.stack.get() + "",
            };
        },
        addBtnOptions: function(): AppUI.UIButtonOptions {
            let tpl = <TemplateAddPlayerToTableInstance>Template.instance();
            return {
                text: "Add",
                onClick: function(): void {
                    addPlayer(tpl);
                },
            };
        },
    });

    function addPlayer(tpl: TemplateAddPlayerToTableInstance): void {
        let name = tpl.name.get();
        let stack = tpl.stack.get();
        
        if (stack < 0)
            return;

        Meteor.call("addPlayerToTable", tpl.data.tableId, tpl.data.seatIndex, name, stack, function(error: Meteor.Error): void {
            if (!error)
                UIPopup.close();
        });
    }
}