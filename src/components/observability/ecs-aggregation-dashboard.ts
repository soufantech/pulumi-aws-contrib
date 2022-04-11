/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch/widget';
import * as pulumi from '@pulumi/pulumi';

import {
    EcsServiceConfig,
    TargetGroupConfig,
    AsgConfig,
    ExtraWidgets,
    WidgetExtraConfigs,
    WrapperWidgetExtraConfigs,
} from './types';
import { ecsAggregationWidgets } from './widget-factories';

export interface EcsAggregationDashboardServiceConfig {
    serviceConfig: EcsServiceConfig;
    targetGroupConfig?: TargetGroupConfig;
}

export interface EcsAggregationDashboardInstanceConfig {
    asgConfig: AsgConfig;
}

export type EcsServiceAggregationDashboardConfig = {
    services: EcsAggregationDashboardServiceConfig[];
    instances?: EcsAggregationDashboardInstanceConfig[];
};

export type EcsServiceAggregationWidgetFactory = (
    configs: EcsServiceAggregationDashboardConfig,
    extraConfigs?: WidgetExtraConfigs
) => Widget[];

export type WrapperEcsServiceAggregationWidgetFactory = (
    configs: EcsServiceAggregationDashboardConfig,
    extraConfigs?: WrapperWidgetExtraConfigs
) => Widget[];

export type EcsAggregationDashboardOptionKey =
    | 'task'
    | 'health'
    | 'request'
    | 'serviceHardware'
    | 'instanceHardware';

export interface EcsAggregationDashboardArgs {
    configs: EcsServiceAggregationDashboardConfig;
    options?: EcsAggregationDashboardOptionKey[];
    defaultOptions?: boolean;
    extraConfigs?: WrapperWidgetExtraConfigs;
    extraWidgets?: ExtraWidgets;
}

export type EcsAggregationDashboardActionValue = WrapperEcsServiceAggregationWidgetFactory;

export type EcsAggregationDashboardActionDict = {
    [option in EcsAggregationDashboardOptionKey]: EcsAggregationDashboardActionValue;
};

export default class EcsAggregationDashboard extends pulumi.ComponentResource {
    readonly dashboard: awsx.cloudwatch.Dashboard;

    static readonly actionDict: EcsAggregationDashboardActionDict = {
        task: EcsAggregationDashboard.createTaskCountWidgets,
        health: EcsAggregationDashboard.createUptimeAndHealthyStatusWidgets,
        request: EcsAggregationDashboard.createLatencyAndRequestCountWidgets,
        serviceHardware: EcsAggregationDashboard.createServiceMemoryAndCpuUtizilationWidgets,
        instanceHardware: EcsAggregationDashboard.createInstanceMemoryAndCpuUtizilationWidgets,
    };

    constructor(name: string, args: EcsAggregationDashboardArgs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:EcsAggregationDashboard', name, {}, opts);

        const { configs, options, defaultOptions, extraConfigs, extraWidgets } = args;

        const computedOptions: EcsAggregationDashboardOptionKey[] = [];
        if (defaultOptions) {
            computedOptions.push(
                'task',
                'health',
                'request',
                'serviceHardware',
                'instanceHardware'
            );
        } else {
            computedOptions.push(...(options || []));
        }

        const widgets: Widget[] = [];

        widgets.push(...(extraWidgets?.begin || []));

        /* eslint-disable security/detect-object-injection */
        widgets.push(
            ...computedOptions
                .map((option) => EcsAggregationDashboard.actionDict[option](configs, extraConfigs))
                .flat()
        );
        /* eslint-enable security/detect-object-injection */

        widgets.push(...(extraWidgets?.end || []));

        this.dashboard = new awsx.cloudwatch.Dashboard(name, { widgets }, { parent: this });
    }

    static createTaskCountWidgets(
        configs: EcsServiceAggregationDashboardConfig,
        extraConfigs?: WrapperWidgetExtraConfigs
    ): Widget[] {
        const { services, instances } = configs;
        if (!services?.length || !instances?.length) return [];

        const ecsServiceAggregationWithInstanceConfig: EcsServiceAggregationDashboardConfig = {
            services,
            instances,
        };

        return ecsAggregationWidgets.createTaskCountWidgets(
            ecsServiceAggregationWithInstanceConfig,
            extraConfigs
        );
    }

    static createUptimeAndHealthyStatusWidgets(
        configs: EcsServiceAggregationDashboardConfig,
        extraConfigs?: WrapperWidgetExtraConfigs
    ): Widget[] {
        const { services } = configs;
        if (!services?.length) return [];

        const ecsServiceAggregationWithInstanceConfig: EcsServiceAggregationDashboardConfig = {
            services,
        };

        return ecsAggregationWidgets.createUptimeAndHealthyWidgets(
            ecsServiceAggregationWithInstanceConfig,
            extraConfigs
        );
    }

    static createLatencyAndRequestCountWidgets(
        configs: EcsServiceAggregationDashboardConfig,
        extraConfigs?: WrapperWidgetExtraConfigs
    ): Widget[] {
        const { services } = configs;
        if (!services?.length) return [];

        const ecsServiceAggregationWithInstanceConfig: EcsServiceAggregationDashboardConfig = {
            services,
        };

        return ecsAggregationWidgets.createLatencyAndRequestCountWidgets(
            ecsServiceAggregationWithInstanceConfig,
            extraConfigs
        );
    }

    static createServiceMemoryAndCpuUtizilationWidgets(
        configs: EcsServiceAggregationDashboardConfig,
        extraConfigs?: WrapperWidgetExtraConfigs
    ): Widget[] {
        const { services } = configs;
        if (!services?.length) return [];

        const ecsServiceAggregationWithInstanceConfig: EcsServiceAggregationDashboardConfig = {
            services,
        };

        return ecsAggregationWidgets.createServiceMemoryAndCpuWidgets(
            ecsServiceAggregationWithInstanceConfig,
            extraConfigs
        );
    }

    static createInstanceMemoryAndCpuUtizilationWidgets(
        configs: EcsServiceAggregationDashboardConfig,
        extraConfigs?: WrapperWidgetExtraConfigs
    ): Widget[] {
        const { services } = configs;
        if (!services?.length) return [];

        const ecsServiceAggregationWithInstanceConfig: EcsServiceAggregationDashboardConfig = {
            services,
        };

        return ecsAggregationWidgets.createInstanceMemoryAndCpuWidgets(
            ecsServiceAggregationWithInstanceConfig,
            extraConfigs
        );
    }
}
