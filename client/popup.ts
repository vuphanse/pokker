export module UIPopup {
    type getParentInstanceType = JQuery | Element | Blaze.View | Blaze.TemplateInstance;
    
    export function getParentInstanceUntil(elementOrViewOrInstance: getParentInstanceType, parentTemplate: Blaze.Template): Blaze.TemplateInstance {
		let parentView: any = null;

		if (elementOrViewOrInstance instanceof Blaze.TemplateInstance) {
			if (elementOrViewOrInstance.view["name"] == parentTemplate.viewName)
				parentView = elementOrViewOrInstance.view;
			else
				parentView = Blaze.getView(elementOrViewOrInstance.view as HTMLElement);
		} else if (elementOrViewOrInstance instanceof Blaze.View) {
			if (elementOrViewOrInstance.name == parentTemplate.viewName)
				parentView = elementOrViewOrInstance;
			else
				parentView = Blaze.getView(elementOrViewOrInstance as any);
		} else if (elementOrViewOrInstance instanceof $) {
			parentView = Blaze.getView(<any>(<JQuery>elementOrViewOrInstance)[0]);
		} else {
			parentView = Blaze.getView(<any>elementOrViewOrInstance);
		}

		while (parentView && !parentView.templateInstance)
			parentView = parentView.parentView;

		return parentView ? parentView.templateInstance() : null;
	}

    export function show(options: UIPopupOptions): void {
        let popupView = Blaze.getView(document.querySelector("#popup-manager"));
        if (popupView.template.viewName.indexOf("templatePopupManager") < 0)
            return;

        console.log(popupView);
        let popupInstance = <TemplatePopupManagerInstance>popupView.templateInstance();
        if (options.modalOptions || !popupInstance.modal) {
            clear(popupInstance);
            update(popupInstance, options);
            popupInstance.modal = $(popupInstance.rootElement).modal(options.modalOptions || {});
            return;
        }

        update(popupInstance, options);
        Tracker.afterFlush(function(popupInstance: TemplatePopupManagerInstance): void {
            popupInstance.modal.modal("show");
        });
    }

    interface UIPopupOptions {
        customTemplate: string;
        customData: any | (() => any);
        title?: string;
        modClasses?: string;
        
        modalOptions?: {
            keyboard: boolean,
            backdrop: boolean | "static",
            focus: boolean;
        },
    }

    interface TemplatePopupManagerInstance extends Blaze.TemplateInstance {
        rootElement: HTMLElement;
        modal: BoostrapModal;
        customTemplate: ReactiveVar<string>;
        customData: ReactiveVar<any>;
        title: ReactiveVar<string>;
        modClasses: ReactiveVar<string>;
    }

    Template.templatePopupManager.onCreated(function(this: TemplatePopupManagerInstance): void {
        this.title = new ReactiveVar("Popup");
        this.modClasses = new ReactiveVar("");
        this.customTemplate = new ReactiveVar("");
        this.customData = new ReactiveVar(null);
    });

    Template.templatePopupManager.onRendered(function(this: TemplatePopupManagerInstance): void {
        let self = this;
        self.rootElement = self.$("#popup-manager").get(0);

        $(self.rootElement).on("hidden.bs.modal", function(): void {
            clear(self);
        });
    });

    Template.templatePopupManager.helpers({
        template: function(): string {
            let tpl = <TemplatePopupManagerInstance>Template.instance();
            return tpl.customTemplate.get();
        },
        data: function(): any {
            let tpl = <TemplatePopupManagerInstance>Template.instance();
            return tpl.customData.get();
        },
        title: function(): string {
            let tpl = <TemplatePopupManagerInstance>Template.instance();
            return tpl.title.get();
        },
        modClasses: function(): string {
            let tpl = <TemplatePopupManagerInstance>Template.instance();
            return tpl.modClasses.get();
        },
    });

    interface BoostrapModal {
        modal: (command: "toggle" | "show" | "hide") => void;
        show: () => void;
        hide: () => void;
    }
    
    function update(popupInstance: TemplatePopupManagerInstance, options: UIPopupOptions): void {
        let { customData, customTemplate, modClasses, title } = options;

        popupInstance.customData.set(customData);
        popupInstance.customTemplate.set(customTemplate);
        popupInstance.modClasses.set(title);
        popupInstance.modClasses.set(modClasses);
    }

    function clear(popupInstance: TemplatePopupManagerInstance): void {
        popupInstance.customData.set(null);
        popupInstance.customTemplate.set("");
        popupInstance.title.set("");
        popupInstance.modClasses.set("");
    }
}