import * as awsx from '@pulumi/awsx/classic';

export class DashboardBuilder {
    private dashboardName: string;

    private widgets: awsx.cloudwatch.Widget[];

    constructor() {
        this.dashboardName = '';
        this.widgets = [];
    }

    name(name: string) {
        this.dashboardName = name;
        return this;
    }

    addWidgets(widgets: awsx.cloudwatch.Widget[]) {
        this.widgets.push(...widgets);
        return this;
    }

    build() {
        if (!this.widgets.length) throw new Error('Dashboard must contain at least one widget');
        if (!this.dashboardName) throw new Error('Dashboard is missing required property: name');
        return new awsx.cloudwatch.Dashboard(this.dashboardName, {
            widgets: this.widgets,
        });
    }
}
