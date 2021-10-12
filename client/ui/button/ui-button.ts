module AppUI {
    export const enum EButtonStyle {
        Default = 1 << 0,
        Primary = 1 << 1,
        Success = 1 << 2,
        Info    = 1 << 3,
        Warning = 1 << 4,
        Danger  = 1 << 5,
        Link    = 1 << 6,
    
        ExtraSmall   = 1 << 7,
        Small   = 1 << 8,
        Medium  = 1 << 9,
        Large   = 1 << 10,
    }

    export interface UIButtonOptions {
        identifierClasses?: string;
        text: string;
        onClick: (event: any) => void;
    
        modClasses?: string;
        tooltip?: string;
        disabled?: boolean;
        style?: EButtonStyle;
    }
    
    interface TemplateUIButtonInstance extends Blaze.TemplateInstance {
        data: UIButtonOptions;
    }
    
    Template.templateUIButton.onCreated(function(this: TemplateUIButtonInstance): void {
    
    });
    
    function getCommonClasses(options: UIButtonOptions): string {
        let classes: string[] = [];
    
        if (options.disabled)
            classes.push("mod-disabled");
        else if (options.style & EButtonStyle.Primary)
            classes.push("btn-primary");
        else if (options.style & EButtonStyle.Success)
            classes.push("btn-success");
        else if (options.style & EButtonStyle.Info)
            classes.push("btn-info");
        else if (options.style & EButtonStyle.Warning)
            classes.push("btn-warning");
        else if (options.style & EButtonStyle.Danger)
            classes.push("btn-danger");
    
        if (options.style & EButtonStyle.Link)
            classes.push("btn-link");
    
        if (options.style & EButtonStyle.ExtraSmall)
            classes.push("btn-xs");
        else if (options.style & EButtonStyle.Small)
            classes.push("btn-sm");
        else if (options.style & EButtonStyle.Large)
            classes.push("btn-lg");
    
        return classes.join(" ");
    }
    
    Template.templateUIButton.helpers({
        modClasses: function(this: UIButtonOptions): string {
            let classes: string[] = [];
            let common = getCommonClasses(this);
    
            if (common)
                classes.push(common);
    
            if (this.modClasses)
                classes.push(this.modClasses);
    
            if (this.identifierClasses)
                classes.push(this.identifierClasses);
    
            return classes.join(" ");
        },
        attributes: function(this: UIButtonOptions): string | any {
            if (this.tooltip)
                return { title: this.tooltip };
        },
    });
    
    Template.templateUIButton.events({
        "click .js-ui-button": function(event: any, tpl: TemplateUIButtonInstance): void {
            if (!tpl.data.disabled && tpl.data.onClick)
                tpl.data.onClick(event);
        },
    });
}