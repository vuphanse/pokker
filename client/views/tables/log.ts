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
        roundText: function(this: DB.TableHandRound): string {
            switch (this.type) {
                case ENUMS.ETableHandRoundType.Preflop: return "Pre-flop";
                case ENUMS.ETableHandRoundType.Flop: return "Flop";
                case ENUMS.ETableHandRoundType.Turn: return "Turn";
                case ENUMS.ETableHandRoundType.River: return "River";
            };
        },
        getRoundLogs: function(this: DB.TableHandRound): string [] {
            return getRoundLogs(this);
        },
        cardsText: function(this: DB.TableHandRound): string {
            return (this.cards || []).join(" ")
                .replace(/s/ig, "♠️")
                .replace(/c/ig, "♣️")
                .replace(/d/ig, "♦️")
                .replace(/h/ig, "♥️");
        },
    });

    function getRoundLogs(round: DB.TableHandRound): string[] {
        if (!round || !round.actions) return [];

        const logInfoMessage = [];

        for (let i = 0; i < round.actions.length; i++) {
            const { actionType, amount, byPlayer: {name}, date} = round.actions[i];
            logInfoMessage.push({ 
                message: `${name} ${ENUMS.ETableHandRoundActionType[actionType].toLowerCase()} ${amount > 0 ? amount : ""}`, 
                date: date.toLocaleString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" },
            )});
        }

        return logInfoMessage;
    }
}