import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import { Widget } from '../../types';

export class DashboardBuilder {
    private dashboardName: string;

    private widgets: pulumi.Input<pulumi.Input<Widget>[]>[];

    constructor() {
        this.dashboardName = '';
        this.widgets = [];
    }

    name(name: string) {
        this.dashboardName = name;
        return this;
    }

    addWidgets(widgets: pulumi.Input<pulumi.Input<Widget>[]>) {
        this.widgets.push(widgets);
        return this;
    }

    build() {
        if (!this.dashboardName) throw new Error('Dashboard is missing required property: name');
        if (!this.widgets.length) throw new Error('Dashboard must contain at least one widget');

        return pulumi.all(this.widgets).apply(
            (widgets) =>
                new aws.cloudwatch.Dashboard(this.dashboardName, {
                    dashboardName: this.dashboardName,
                    dashboardBody: JSON.stringify({ widgets: widgets.flat() }),
                })
        );
    }
}
