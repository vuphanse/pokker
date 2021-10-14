import { ENum } from "../../ui/enums";

module MainApp.Table {
    interface TemplateCreateNewTableInstance extends Blaze.TemplateInstance {
        name: ReactiveVar<string>;
        numSeats: ReactiveVar<number>;
    }

    Template.templateCreateNewTable.onCreated(function(this: TemplateCreateNewTableInstance): void {
        this.name = new ReactiveVar("");
        this.numSeats = new ReactiveVar(8);
    });

    Template.templateCreateNewTable.helpers({
        tableNameInputOptions: function(): AppUI.UIInputOptions {
            let tpl = <TemplateCreateNewTableInstance>Template.instance();
            return {
                modClasses: "tablename-input",
                label: "Table name",
                type: "text",
                value: tpl.name.get(),
                onInputChange: value => tpl.name.set(value),
            };
        },
        numSeatsInputOptions: function(): AppUI.UIInputOptions {
            let tpl = <TemplateCreateNewTableInstance>Template.instance();
            return {
                modClasses: "numseats-input",
                label: "How many seats?",
                type: "number",
                maxValue: 10,
                value: tpl.numSeats.get() + "",
                onInputChange: value => tpl.numSeats.set(parseInt(value) || 0),
            };
        },
        createBtnOptions: function(): AppUI.UIButtonOptions {
            let tpl = <TemplateCreateNewTableInstance>Template.instance();

            return {
                text: "Create",
                onClick: () => createTable(tpl),
                style: ENum.EButtonStyle.Small | ENum.EButtonStyle.Success,
            };
        },
    });

    function createTable(tpl: TemplateCreateNewTableInstance): void {
        Meteor.call("createNewTable", tpl.name.get(), tpl.numSeats.get(), function(error: Meteor.Error, tableId: string): void {
            if (error)
                alert(`Failed to create table, reason: ${error.reason}`);
        });
    };
}