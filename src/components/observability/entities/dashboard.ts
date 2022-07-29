import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';
import * as pulumi from '@pulumi/pulumi';

export default class Dashboard extends pulumi.ComponentResource {
    dashboard: awsx.cloudwatch.Dashboard;

    constructor(type: string, name: string, widgets: Widget[], opts?: pulumi.ResourceOptions) {
        super(type, name, {}, opts);
        this.dashboard = new awsx.cloudwatch.Dashboard(name, { widgets }, { parent: this });
    }

    getArn() {
        return this.dashboard.dashboardArn;
    }
}
