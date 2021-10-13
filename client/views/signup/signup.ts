import { ENum } from "../../ui/enums";

module MainApp {
    interface TemplateAppSignUpInstance extends Blaze.TemplateInstance {
        email: ReactiveVar<string>;
        password: ReactiveVar<string>;
        repassword: ReactiveVar<string>;
        errorMessage: ReactiveVar<string>;
        successMessage: ReactiveVar<string>;
    }

    Template.templateAppSignUp.onCreated(function(this: TemplateAppSignUpInstance): void {
        this.email = new ReactiveVar("");
        this.password = new ReactiveVar("");
        this.repassword = new ReactiveVar("");
        this.errorMessage = new ReactiveVar("");
        this.successMessage = new ReactiveVar("");
    });

    Template.templateAppSignUp.helpers({
        emailInputOptions: function(): AppUI.UIInputOptions {
            let tpl = <TemplateAppSignUpInstance>Template.instance();
            return {
                label: "Email",
                type: "text",
                onInputChange: value => tpl.email.set(value),
                value: tpl.email.get(),
            };
        },
        passwordInputOptions: function(): AppUI.UIInputOptions {
            let tpl = <TemplateAppSignUpInstance>Template.instance();
            return {
                label: "Password",
                type: "password",
                onInputChange: value => tpl.password.set(value),
                value: tpl.password.get(),
            };
        },
        repasswordInputOptions: function(): AppUI.UIInputOptions {
            let tpl = <TemplateAppSignUpInstance>Template.instance();
            return {
                label: "Re-enter password",
                type: "password",
                onInputChange: value => tpl.repassword.set(value),
                value: tpl.repassword.get(),
            };
        },
        signupBtnOptions: function(): AppUI.UIButtonOptions {
            let tpl = <TemplateAppSignUpInstance>Template.instance();
            return {
                text: "Sign up",
                style: ENum.EButtonStyle.Primary | ENum.EButtonStyle.Medium,
                onClick: function(event: any): void {
                    if (validatePassword(tpl))
                        createUser(tpl);
                },
            };
        },
        errorMessage: function(): string {
            let tpl = <TemplateAppSignUpInstance>Template.instance();
            return tpl.errorMessage.get();
        },
        message: function(): string {
            let tpl = <TemplateAppSignUpInstance>Template.instance();
            return tpl.successMessage.get();
        },
    });

    function validatePassword(tpl: TemplateAppSignUpInstance): boolean {
        let password = tpl.password.get();
        let repassword = tpl.repassword.get();
        if (password.length < 8) {
            tpl.errorMessage.set("Password must be longer than 8 characters");
            return false;
        }

        if (password !== repassword) {
            tpl.errorMessage.set("Passwords not matched");
            return false;
        }
        
        return true;
    }

    function createUser(tpl: TemplateAppSignUpInstance): void {
        let email = tpl.email.get();
        let password = tpl.password.get();

        Accounts.createUser({
            email,
            password,
        }, function(error: Meteor.Error): void {
            if (error) {
                tpl.errorMessage.set("Signup failed, reason was " + error.reason);
                return;
            }

            tpl.errorMessage.set("");
            tpl.successMessage.set(`Welcome to Pokker!, ${email}`);
            setTimeout(() => Router.go("/"), 2000);
        });
    }
}