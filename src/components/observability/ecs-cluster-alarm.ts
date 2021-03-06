import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import { asgAlarm, ecsClusterAlarm } from './alarm-factories';
import {
    AsgConfig,
    EcsClusterConfig,
    WrapperAlarmExtraConfigs,
    WrapperAlarmFactory,
} from './types';

export type EcsClusterAlarmConfigKey = 'clusterName' | 'asgName';

export type EcsClusterAlarmConfig = {
    [config in EcsClusterAlarmConfigKey]?: string;
};

export type EcsClusterAlarmOptionKey =
    | 'asgGroupMaxSize'
    | 'cpuUtilization'
    | 'memoryUtilization'
    | 'networkRxBytes'
    | 'networkTxBytes'
    | 'storageReadBytes'
    | 'storageWriteBytes';

export type EcsClusterAlarmOption = {
    [option in EcsClusterAlarmOptionKey]?: number;
};

export type EcsClusterAlarmResult = {
    [option in EcsClusterAlarmOptionKey]?: aws.cloudwatch.MetricAlarm;
};

export interface EcsClusterAlarmArgs {
    configs: EcsClusterAlarmConfig;
    options: EcsClusterAlarmOption;
    extraConfigs?: WrapperAlarmExtraConfigs;
}

export type EcsClusterAlarmActionValue = WrapperAlarmFactory;

export type EcsClusterAlarmActionDict = {
    [option in EcsClusterAlarmOptionKey]: EcsClusterAlarmActionValue;
};

export default class EcsClusterAlarm extends pulumi.ComponentResource {
    readonly alarms?: EcsClusterAlarmResult;

    readonly actionDict: EcsClusterAlarmActionDict = {
        asgGroupMaxSize: this.createAsgMaxGroupSizeAlarm,
        cpuUtilization: this.createCpuUtilizationAlarm,
        memoryUtilization: this.createMemoryUtilizationAlarm,
        networkRxBytes: this.createNetworkRxBytesAlarm,
        networkTxBytes: this.createNetworkTxBytesAlarm,
        storageReadBytes: this.createStorageReadBytesAlarm,
        storageWriteBytes: this.createStorageWriteBytesAlarm,
    };

    constructor(name: string, args: EcsClusterAlarmArgs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:EcsClusterAlarm', name, {}, opts);

        const { configs, options, extraConfigs } = args;

        const alarms: EcsClusterAlarmResult = {};

        const optionKeys = Object.keys(options) as EcsClusterAlarmOptionKey[];

        /* eslint-disable security/detect-object-injection */
        optionKeys.forEach((optionKey) => {
            const threshold = options[optionKey];
            if (!threshold) return;

            const alarm = this.actionDict[optionKey].bind(this)(
                name,
                threshold,
                configs,
                extraConfigs
            );

            if (alarm) {
                alarms[optionKey] = alarm;
            }
        });
        /* eslint-disable security/detect-object-injection */

        this.alarms = alarms;
    }

    private createAsgMaxGroupSizeAlarm(
        name: string,
        threshold: number,
        configs: Record<string, string>,
        extraConfigs?: WrapperAlarmExtraConfigs
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { asgName } = configs;
        if (!asgName) return undefined;

        const asgConfig: AsgConfig = {
            asgName,
        };

        return asgAlarm.createAsgMaxGroupSizeAlarm(name, threshold, asgConfig, {
            parent: this,
            ...extraConfigs,
        });
    }

    private createCpuUtilizationAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const ecsClusterConfig: EcsClusterConfig = {
            clusterName,
        };

        return ecsClusterAlarm.createCpuUtilizationAlarm(name, threshold, ecsClusterConfig, {
            parent: this,
            ...extraConfigs,
        });
    }

    private createMemoryUtilizationAlarm(
        name: string,
        threshold: number,
        configs: Record<string, string>,
        extraConfigs?: WrapperAlarmExtraConfigs
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const ecsClusterConfig: EcsClusterConfig = {
            clusterName,
        };

        return ecsClusterAlarm.createMemoryUtilizationAlarm(name, threshold, ecsClusterConfig, {
            parent: this,
            ...extraConfigs,
        });
    }

    private createNetworkRxBytesAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const ecsClusterConfig: EcsClusterConfig = {
            clusterName,
        };

        return ecsClusterAlarm.createNetworkRxBytesAlarm(name, threshold, ecsClusterConfig, {
            parent: this,
            ...extraConfigs,
        });
    }

    private createNetworkTxBytesAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const ecsClusterConfig: EcsClusterConfig = {
            clusterName,
        };

        return ecsClusterAlarm.createNetworkTxBytesAlarm(name, threshold, ecsClusterConfig, {
            parent: this,
            ...extraConfigs,
        });
    }

    private createStorageReadBytesAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const ecsClusterConfig: EcsClusterConfig = {
            clusterName,
        };

        return ecsClusterAlarm.createStorageReadBytesAlarm(name, threshold, ecsClusterConfig, {
            parent: this,
            ...extraConfigs,
        });
    }

    private createStorageWriteBytesAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const ecsClusterConfig: EcsClusterConfig = {
            clusterName,
        };

        return ecsClusterAlarm.createStorageWriteBytesAlarm(name, threshold, ecsClusterConfig, {
            parent: this,
            ...extraConfigs,
        });
    }
}
