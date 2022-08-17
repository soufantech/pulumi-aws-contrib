import { Widget } from '@pulumi/awsx/cloudwatch';

import { DashboardStoreCommand } from './dashboard-store-command';

export class AddWidgetsCommand implements DashboardStoreCommand {
    type = 'AddWidgets';

    constructor(private widgets: Widget[]) {}

    execute(): Widget[] {
        return this.widgets;
    }
}
