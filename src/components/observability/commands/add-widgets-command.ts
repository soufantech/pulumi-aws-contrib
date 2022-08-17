import { Widget } from '@pulumi/awsx/cloudwatch';

import { DashboardStoreCommand } from './dashboard-store-command';

export class AddWidgetsCommand implements DashboardStoreCommand {
    constructor(private widgets: Widget[]) {}

    execute(): Widget[] {
        return this.widgets;
    }
}
