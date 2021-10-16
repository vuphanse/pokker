import { ENUMS } from "../../../lib/sharedenums";
import "../../imports";

declare module Template {
    const templateTableHandLog: Blaze.Template;
}

module MainApp {
    interface TemplateTableHandLogInstance extends Blaze.TemplateInstance {
        data: DB.TableHand;
    }

    Template.templateTableHandLog.helpers({
        logData: function(this: DB.TableHand): string[] {
            const logMessage = convertLogDataToMessage(this);

            return logMessage;
        },
    });

    function convertLogDataToMessage(logInfo: DB.TableHand): string[] {
        if (!logInfo) return [];

        const logInfoMessage = [];

        for (let i = 0; i < logInfo.rounds[0].actions.length; i++) {
            const { actionType, amount, byPlayer: {name}, date} = logInfo.rounds[0].actions[i];
            logInfoMessage.push({ message: `${name} ${ENUMS.ETableHandRoundActionType[actionType].toLowerCase()} ${amount}`, date: date.toLocaleTimeString() });
        }

        if (logInfo.isFinished) {
            logInfoMessage.push({ message: `The winner is: ${logInfo.winner}`, date: new Date().toLocaleTimeString() });
        }

        return logInfoMessage;
    }
}