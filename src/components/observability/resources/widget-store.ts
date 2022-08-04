import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';

import { AddWidgetsCommand } from '../commands/add-widgets-command';
import { DashboardStoreCommand } from '../commands/dashboard-store-command';

export class DashboardStore extends pulumi.ComponentResource {
    private widgets: awsx.cloudwatch.Widget[] = [];

    constructor(
        type: string,
        private name: string,
        args?: pulumi.Inputs,
        opts?: pulumi.ResourceOptions
    ) {
        super(type, name, args, opts);
        this.widgets = [];
    }

    private addWidgetsReducer(command: DashboardStoreCommand) {
        if (command instanceof AddWidgetsCommand) {
            this.widgets = [...this.widgets, ...command.execute(this)];
        }
    }

    dispatch(...commands: DashboardStoreCommand[]) {
        commands.forEach((command) => {
            if (command.type === 'AddWidgets') this.addWidgetsReducer(command);
        });
    }

    getDashboard() {
        return new awsx.cloudwatch.Dashboard(
            this.name,
            { widgets: this.widgets },
            { parent: this }
        );
    }
}
