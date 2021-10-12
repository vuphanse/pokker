module AppUI {
    export interface UIInputOptions {
        value: string;
        onInputChange: (value: string) => void;
        modClasses?: string;
        type?: "text" | "number" | "password" | "email";
        placeholder?: string;
        label?: string;
        disabled?: boolean;
        readonly?: boolean;
        maxLength?: number;
        minValue?: number;
        maxValue?: number;
    }
    
    interface TemplateUIInputInstance extends Blaze.TemplateInstance {
        data: UIInputOptions;
    }
    
    Template.templateUIInput.onCreated(function(this: TemplateUIInputInstance): void {
    
    });
    
    Template.templateUIInput.helpers({
        modClasses: function(this: UIInputOptions): string {
            let classes: string[] = [];
            if (this.modClasses)
                classes.push(this.modClasses);
    
            return classes.join(" ");
        },
        type: function(this: UIInputOptions): string {
            return this.type || "text";
        },
        inputAttributes: function(this: UIInputOptions): any {
            let attributes: any = {};
    
            if (this.disabled)
                attributes.disabled = true;
    
            if (this.readonly)
                attributes.readonly = true;
    
            if (this.placeholder)
                attributes.placeholder = this.placeholder;
    
            if (this.maxLength !== undefined)
                attributes.maxlength = this.maxLength;
    
            if (this.minValue !== undefined)
                attributes.min = this.minValue;
    
            if (this.maxValue !== undefined)
                attributes.max = this.maxValue;
    
            return attributes;
        },
    });
    
    Template.templateUIInput.events({
        "input .js-input, keyup .js-input, change .js-input, paste .js-input": function(event: any, tpl: TemplateUIInputInstance): void {
            if (tpl.data.readonly)
                return;
    
            if (event.which === 9)
                return; // Tab focus
    
            let currentValue = getCurrentValue(tpl);
    
            if (tpl.data.onInputChange)
                tpl.data.onInputChange(currentValue);
        },
    });
    
    function getCurrentValue(tpl: TemplateUIInputInstance): string {
        let inputElement = <HTMLInputElement>tpl.find(".js-input");
        if (!inputElement.checkValidity || inputElement.checkValidity())
            return inputElement.value;
    }
}