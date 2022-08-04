import { Widget } from '@pulumi/awsx/cloudwatch';

import { DashboardStore } from '../resources/widget-store';
import { DashboardStoreCommand } from './dashboard-store-command';

export class AddWidgetsCommand implements DashboardStoreCommand {
    type = 'AddWidgets';

    constructor(private widgets: Widget[]) {}

    execute(parent: DashboardStore): Widget[] {
        return this.widgets;
    }
}
