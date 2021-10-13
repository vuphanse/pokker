export function checkUserAccess(): void {
    let userId = Meteor.userId();
    if (!userId)
        throw new Meteor.Error(403, "Access denided");
}