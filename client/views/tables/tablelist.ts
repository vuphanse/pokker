import { DBCollection } from "../../../lib/collections";

module MainApp {
    const numTablesPerPage = 10;

    interface TemplateTablesListInstance extends Blaze.TemplateInstance {
        currentPageIndex: ReactiveVar<number>;
        loading: ReactiveVar<boolean>;
    }

    Template.templateTablesList.onCreated(function(this: TemplateTablesListInstance): void {
        let self = this;
        self.currentPageIndex = new ReactiveVar(0);
        self.loading = new ReactiveVar(true);

        self.autorun(function(): void {
            let limit = getTablesQueryLimit(self);
            self.subscribe("subscribeTables", limit, {
                onReady: function(): void {
                    self.loading.set(false);
                },
            });
        });
    });
    
    Template.templateTablesList.helpers({
        isLoading: function(): boolean {
            let tpl = <TemplateTablesListInstance>Template.instance();
            return tpl.loading.get();
        },
        tables: function(): DB.Table[] {
            let tpl = <TemplateTablesListInstance>Template.instance();
            let limit = getTablesQueryLimit(tpl);
            return DBCollection.Tables.find({}, {
                skip: limit - numTablesPerPage,
                limit: limit,
                sort: {
                    createdAt: -1,
                },
            }).fetch();
        },
    });

    Template.templateTablesList.events({
        "click .js-previous": function(event: any, tpl: TemplateTablesListInstance): void {
            tpl.currentPageIndex.set(tpl.currentPageIndex.get() - 1);
        },
        "click .js-next": function(event: any, tpl: TemplateTablesListInstance): void {
            tpl.currentPageIndex.set(tpl.currentPageIndex.get() + 1);
        },
        "click .js-table-row": function(event: any): void {
            let row = $(event.currentTarget);
            Router.go("table", {
                tableId: row.attr("id"),
            });
        },
    });

    function getTablesQueryLimit(tpl: TemplateTablesListInstance): number {
        return numTablesPerPage * (tpl.currentPageIndex.get() + 1);
    }
}