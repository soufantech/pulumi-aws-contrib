import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';
import * as pulumi from '@pulumi/pulumi';

import {
    ExtraWidgets,
    AsgConfig,
    EcsClusterConfig,
    EcsClusterWithAsgConfig,
    WrapperWidgetFactory,
    WrapperWidgetExtraConfigs,
} from './types';
import { asgWidgets, ecsClusterWidgets } from './widget-factories';

export type EcsClusterDashboardConfigKey = 'clusterName' | 'asgName';

export type EcsClusterDashboardConfig = {
    [config in EcsClusterDashboardConfigKey]?: string;
};

export type EcsClusterDashboardOptionKey =
    | 'task'
    | 'hardware'
    | 'inputOutputRate'
    | 'inputOutputBytes'
    | 'inputOutputCount';

export interface EcsClusterDashboardArgs {
    configs: EcsClusterDashboardConfig;
    options?: EcsClusterDashboardOptionKey[];
    defaultOptions?: boolean;
    extraConfigs?: WrapperWidgetExtraConfigs;
    extraWidgets?: ExtraWidgets;
}

export type EcsClusterDashboardActionValue = WrapperWidgetFactory;

export type EcsClusterDashboardActionDict = {
    [option in EcsClusterDashboardOptionKey]: EcsClusterDashboardActionValue;
};

export default class EcsClusterDashboard extends pulumi.ComponentResource {
    readonly dashboard: awsx.cloudwatch.Dashboard;

    static readonly actionDict: EcsClusterDashboardActionDict = {
        task: EcsClusterDashboard.createTaskCountWidgets,
        hardware: EcsClusterDashboard.createMemoryAndCpuUtizilationWidgets,
        inputOutputRate: EcsClusterDashboard.createNetworkAndStorageRateWidgets,
        inputOutputBytes: EcsClusterDashboard.createNetworkAndStorageIoBytesWidgets,
        inputOutputCount: EcsClusterDashboard.createNetworkAndStorageIoCountWidgets,
    };

    constructor(name: string, args: EcsClusterDashboardArgs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:EcsClusterDashboard', name, {}, opts);

        const { configs, defaultOptions, options, extraConfigs, extraWidgets } = args;

        const computedOptions: EcsClusterDashboardOptionKey[] = [];
        if (defaultOptions) {
            computedOptions.push(
                'task',
                'hardware',
                'inputOutputRate',
                'inputOutputBytes',
                'inputOutputCount'
            );
        } else {
            computedOptions.push(...(options || []));
        }

        const widgets: Widget[] = [];

        widgets.push(...(extraWidgets?.begin || []));

        /* eslint-disable security/detect-object-injection */
        widgets.push(
            ...computedOptions
                .map((option) => EcsClusterDashboard.actionDict[option](configs, extraConfigs))
                .flat()
        );
        /* eslint-enable security/detect-object-injection */

        widgets.push(...(extraWidgets?.end || []));

        this.dashboard = new awsx.cloudwatch.Dashboard(name, { widgets }, { parent: this });
    }

    static createTaskCountWidgets(
        configs: Record<string, string>,
        extraConfigs?: WrapperWidgetExtraConfigs
    ): Widget[] {
        const { clusterName, asgName } = configs;
        if (!clusterName) return [];

        const ecsClusterWithAsgConfig: EcsClusterWithAsgConfig = {
            clusterName,
            asgName,
        };

        return ecsClusterWidgets.createTaskCountWidgets(ecsClusterWithAsgConfig, extraConfigs);
    }

    static createMemoryAndCpuUtizilationWidgets(
        configs: Record<string, string>,
        extraConfigs?: WrapperWidgetExtraConfigs
    ): Widget[] {
        const { clusterName } = configs;
        if (!clusterName) return [];

        const ecsClusterConfig: EcsClusterConfig = {
            clusterName,
        };

        return ecsClusterWidgets.createMemoryAndCpuWidgets(ecsClusterConfig, extraConfigs);
    }

    static createNetworkAndStorageRateWidgets(
        configs: Record<string, string>,
        extraConfigs?: WrapperWidgetExtraConfigs
    ): Widget[] {
        const { clusterName } = configs;
        if (!clusterName) return [];

        const ecsClusterConfig: EcsClusterConfig = {
            clusterName,
        };

        return ecsClusterWidgets.createNetworkAndStorageRateWidgets(ecsClusterConfig, extraConfigs);
    }

    static createNetworkAndStorageIoBytesWidgets(
        configs: Record<string, string>,
        extraConfigs?: WrapperWidgetExtraConfigs
    ): Widget[] {
        const { asgName } = configs;
        if (!asgName) return [];

        const asgConfig: AsgConfig = {
            asgName,
        };

        return asgWidgets.createNetworkAndStorageIoBytesWidgets(asgConfig, extraConfigs);
    }

    static createNetworkAndStorageIoCountWidgets(
        configs: Record<string, string>,
        extraConfigs?: WrapperWidgetExtraConfigs
    ): Widget[] {
        const { asgName } = configs;
        if (!asgName) return [];

        const asgConfig: AsgConfig = {
            asgName,
        };

        return asgWidgets.createNetworkAndStorageIoCountWidgets(asgConfig, extraConfigs);
    }
}
