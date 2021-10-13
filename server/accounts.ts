module MainApp {
    export function validateEmail(email: string): boolean {
        return email.indexOf("@") > 0 && (email.indexOf("@") < email.length - 1);
    }

    Accounts.onCreateUser(function(options: any, user: Meteor.User): Meteor.User {
        check(options, {
            email: String,
            password: Match.Any,
        });

        if (!user.emails || user.emails.length != 1 || !user.emails[0].address)
            throw new Meteor.Error(403, "Invalid email 1");

        let email = user.emails[0].address;
        if (!validateEmail(email))
            throw new Meteor.Error(403, "Invalid email 2");

        let exists = !!Meteor.users.findOne({
            mainEmail: email,
        });

        if (exists)
            throw new Meteor.Error("Invalid email 3");

        user.username = email.split("@")[0];
        user["mainEmail"] = email;

        return user;
    });
}