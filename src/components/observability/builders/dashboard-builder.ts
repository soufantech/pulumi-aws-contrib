import * as awsx from '@pulumi/awsx';

export class DashboardBuilder {
    private name: string;

    private widgets: awsx.cloudwatch.Widget[];

    constructor() {
        this.name = '';
        this.widgets = [];
    }

    setName(name: string) {
        this.name = name;
        return this;
    }

    addWidgets(widgets: awsx.cloudwatch.Widget[]) {
        this.widgets = [...this.widgets, ...widgets];
        return this;
    }

    build() {
        if (!this.widgets.length) throw new Error('Dashboard must contain at least one widget');
        if (!this.name) throw new Error('Dashboard is missing required property: name');
        return new awsx.cloudwatch.Dashboard(this.name, {
            widgets: this.widgets,
        });
    }
}
