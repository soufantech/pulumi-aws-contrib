import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';

import { AddWidgetsCommand } from '../commands/add-widgets-command';
import { DashboardStoreCommand } from '../commands/dashboard-store-command';

export class DashboardStore extends pulumi.ComponentResource {
    private widgets: awsx.cloudwatch.Widget[] = [];

    private dashboard: awsx.cloudwatch.Dashboard;

    constructor(private name: string, args?: pulumi.Inputs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:DashboardStore', name, args, opts);
        this.widgets = [];
        this.dashboard = new awsx.cloudwatch.Dashboard(
            this.name,
            { widgets: this.widgets },
            { parent: this }
        );
    }

    private addWidgetsReducer(command: AddWidgetsCommand) {
        this.widgets = [...this.widgets, ...command.execute()];
    }

    dispatch(...commands: DashboardStoreCommand[]) {
        commands.forEach((command) => {
            if (command instanceof AddWidgetsCommand) this.addWidgetsReducer(command);
        });
    }

    private updateDashboard() {
        this.dashboard = new awsx.cloudwatch.Dashboard(
            this.name,
            { widgets: this.widgets },
            { parent: this, urn: String(this.dashboard.urn), id: this.dashboard.id }
        );
    }

    getDashboard() {
        this.updateDashboard();
        return this.dashboard;
    }

    getArn() {
        return this.getDashboard().dashboardArn;
    }
}
