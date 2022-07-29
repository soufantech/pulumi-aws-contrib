/* eslint-disable sonarjs/no-duplicate-string */
import { Widget } from '@pulumi/awsx/cloudwatch';
import * as pulumi from '@pulumi/pulumi';

import Dashboard from './entities/dashboard';
import {
    TargetGroupConfig,
    EcsServiceConfig,
    EcsServiceWithAsgConfig,
    WrapperWidgetExtraConfigs,
} from './types';
import { tgWidgets, ecsServiceWidgets } from './widget-factories';

export default class EcsServiceDashboardBuilder {
    widgets: Widget[];

    constructor(private name: string, readonly opts?: pulumi.ResourceOptions) {
        this.widgets = [];
    }

    build() {
        return new Dashboard(
            'contrib:components:EcsServiceDashboard',
            this.name,
            this.widgets,
            this.opts
        );
    }

    private pushWidgets(widgets: Widget[]) {
        this.widgets = [...this.widgets, ...widgets];
    }

    taskCountWidgets(configs: EcsServiceWithAsgConfig, extraConfigs?: WrapperWidgetExtraConfigs) {
        this.pushWidgets(ecsServiceWidgets.createTaskCountWidgets(configs, extraConfigs));
        return this;
    }

    uptimeAndHealthyStatusWidgets(
        configs: TargetGroupConfig,
        extraConfigs?: WrapperWidgetExtraConfigs
    ) {
        this.pushWidgets(tgWidgets.createUptimeAndHealthyWidgets(configs, extraConfigs));
        return this;
    }

    latencyAndRequestCountWidgets(
        configs: TargetGroupConfig,
        extraConfigs?: WrapperWidgetExtraConfigs
    ) {
        this.pushWidgets(tgWidgets.createLatencyAndRequestCountWidgets(configs, extraConfigs));
        return this;
    }

    memoryAndCpuUtizilationWidgets(
        configs: EcsServiceConfig,
        extraConfigs?: WrapperWidgetExtraConfigs
    ) {
        this.pushWidgets(ecsServiceWidgets.createMemoryAndCpuWidgets(configs, extraConfigs));
        return this;
    }

    memoryAndCpuExtraInfoWidgets(
        configs: EcsServiceConfig,
        extraConfigs?: WrapperWidgetExtraConfigs
    ) {
        this.pushWidgets(ecsServiceWidgets.createMemoryAndCpuExtraWidgets(configs, extraConfigs));
        return this;
    }

    networkAndStorageWidgets(configs: EcsServiceConfig, extraConfigs?: WrapperWidgetExtraConfigs) {
        this.pushWidgets(ecsServiceWidgets.createNetworkAndStorageWidgets(configs, extraConfigs));
        return this;
    }
}
