import "./../../imports";
import { ENum } from "../../ui/enums";

module MainApp {
    interface TemplateAppLoginInstance extends Blaze.TemplateInstance {
        email: ReactiveVar<string>;
        password: ReactiveVar<string>;
        errorMessage: ReactiveVar<string>;
    }

    Template.templateAppLogin.onCreated(function(this: TemplateAppLoginInstance): void {
        if (Meteor.userId())
            return Router.go("home");

        this.email = new ReactiveVar("");
        this.password = new ReactiveVar("");
        this.errorMessage = new ReactiveVar("");
    });

    Template.templateAppLogin.helpers({
        emailInputOptions: function(): AppUI.UIInputOptions {
            let tpl = <TemplateAppLoginInstance>Template.instance();

            return {
                type: "text",
                value: tpl.email.get(),
                label: "Email",
                onInputChange: value => tpl.email.set(value),
            };
        },
        passwordInputOptions: function(): AppUI.UIInputOptions {
            let tpl = <TemplateAppLoginInstance>Template.instance();

            return {
                type: "password",
                value: tpl.password.get(),
                label: "Password",
                onInputChange: value => tpl.password.set(value),
            };
        },
        loginBtnOptions: function(): AppUI.UIButtonOptions {
            let tpl = <TemplateAppLoginInstance>Template.instance();

            return {
                text: "Sign in",
                style: ENum.EButtonStyle.Medium | ENum.EButtonStyle.Success,
                onClick: () => login(tpl),
            };
        },
        errorMessage: function(): string {
            let tpl = <TemplateAppLoginInstance>Template.instance();
            return tpl.errorMessage.get();
        },
    });

    function login(tpl: TemplateAppLoginInstance): void {
        let email = tpl.email.get();
        let password = tpl.password.get();

        Meteor.loginWithPassword(email, password, function(error: Meteor.Error): void {
            if (error) {
                tpl.errorMessage.set(error.reason);
                return;
            }

            Router.go("home");
        });
    }
}