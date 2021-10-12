/// <reference path="../definitions/index.d.ts"/>

export module AuthRouter {
    export function login(signup: boolean = false): void {
        Router.go(signup ? "signup" : "signin", {}, {
            replaceState: true,
        });
    }
}

Router.route("/signin", {
    name: "signin",
    action: function(): void {
        this.render("templateAppLogin");
    },
});