/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';
import * as pulumi from '@pulumi/pulumi';

import {
    ExtraWidgets,
    TargetGroupConfig,
    EcsServiceConfig,
    EcsServiceWithAsgConfig,
    WrapperWidgetFactory,
} from './types';
import { tgWidgets, ecsServiceWidgets } from './widget-factories';

export type EcsServiceDashboardConfigKey =
    | 'clusterName'
    | 'serviceName'
    | 'loadBalancer'
    | 'targetGroup'
    | 'asgName';

export type EcsServiceDashboardConfig = {
    [config in EcsServiceDashboardConfigKey]?: string;
};

export type EcsServiceDashboardOptionKey =
    | 'task'
    | 'health'
    | 'request'
    | 'hardware'
    | 'hardwareExtra'
    | 'inputOutput';

export interface EcsServiceDashboardArgs {
    configs: EcsServiceDashboardConfig;
    options?: EcsServiceDashboardOptionKey[];
    defaultOptions?: boolean;
    extraWidgets?: ExtraWidgets;
}

export type EcsServiceDashboardActionValue = WrapperWidgetFactory;

export type EcsServiceDashboardActionDict = {
    [option in EcsServiceDashboardOptionKey]: EcsServiceDashboardActionValue;
};

export default class EcsServiceDashboard extends pulumi.ComponentResource {
    readonly dashboard: awsx.cloudwatch.Dashboard;

    static readonly actionDict: EcsServiceDashboardActionDict = {
        task: EcsServiceDashboard.createTaskCountWidgets,
        health: EcsServiceDashboard.createUptimeAndHealthyStatusWidgets,
        request: EcsServiceDashboard.createLatencyAndRequestCountWidgets,
        hardware: EcsServiceDashboard.createMemoryAndCpuUtizilationWidgets,
        hardwareExtra: EcsServiceDashboard.createMemoryAndCpuExtraInfoWidgets,
        inputOutput: EcsServiceDashboard.createNetworkAndStorageWidgets,
    };

    constructor(name: string, args: EcsServiceDashboardArgs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:EcsServiceDashboard', name, {}, opts);

        const { configs, defaultOptions, options, extraWidgets } = args;

        const computedOptions: EcsServiceDashboardOptionKey[] = [];
        if (defaultOptions) {
            computedOptions.push(
                'task',
                'health',
                'request',
                'hardware',
                'hardwareExtra',
                'inputOutput'
            );
        } else {
            computedOptions.push(...(options || []));
        }

        const widgets: Widget[] = [];

        widgets.push(...(extraWidgets?.begin || []));

        /* eslint-disable security/detect-object-injection */
        widgets.push(
            ...computedOptions
                .map((option) => EcsServiceDashboard.actionDict[option](configs))
                .flat()
        );
        /* eslint-enable security/detect-object-injection */

        widgets.push(...(extraWidgets?.end || []));

        this.dashboard = new awsx.cloudwatch.Dashboard(name, { widgets }, { parent: this });
    }

    static createTaskCountWidgets(configs: Record<string, string>): Widget[] {
        const { clusterName, serviceName, asgName } = configs;
        if (!clusterName || !serviceName) return [];

        const ecsServiceWithAsgConfig: EcsServiceWithAsgConfig = {
            clusterName,
            serviceName,
            asgName,
        };

        return ecsServiceWidgets.createTaskCountWidgets(ecsServiceWithAsgConfig);
    }

    static createUptimeAndHealthyStatusWidgets(configs: Record<string, string>): Widget[] {
        const { loadBalancer, targetGroup } = configs;
        if (!loadBalancer || !targetGroup) return [];

        const tgConfig: TargetGroupConfig = {
            loadBalancer,
            targetGroup,
        };

        return tgWidgets.createUptimeAndHealthyWidgets(tgConfig);
    }

    static createLatencyAndRequestCountWidgets(configs: Record<string, string>): Widget[] {
        const { loadBalancer, targetGroup } = configs;
        if (!loadBalancer || !targetGroup) return [];

        const tgConfig: TargetGroupConfig = {
            loadBalancer,
            targetGroup,
        };

        return tgWidgets.createLatencyAndRequestCountWidgets(tgConfig);
    }

    static createMemoryAndCpuUtizilationWidgets(configs: Record<string, string>): Widget[] {
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return [];

        const ecsServiceConfig: EcsServiceConfig = {
            clusterName,
            serviceName,
        };

        return ecsServiceWidgets.createMemoryAndCpuWidgets(ecsServiceConfig);
    }

    static createMemoryAndCpuExtraInfoWidgets(configs: Record<string, string>): Widget[] {
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return [];

        const ecsServiceConfig: EcsServiceConfig = {
            clusterName,
            serviceName,
        };

        return ecsServiceWidgets.createMemoryAndCpuExtraWidgets(ecsServiceConfig);
    }

    static createNetworkAndStorageWidgets(configs: Record<string, string>): Widget[] {
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return [];

        const ecsServiceConfig: EcsServiceConfig = {
            clusterName,
            serviceName,
        };

        return ecsServiceWidgets.createNetworkAndStorageWidgets(ecsServiceConfig);
    }
}
