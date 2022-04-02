/* eslint-disable sonarjs/no-duplicate-string */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import createAsgMaxGroupSizeAlarm from './alarm-factories/create-asg-max-group-size-alarm';
import createCpuUtilizationAlarm from './alarm-factories/create-cpu-utilization-alarm';
import createMemoryUtilizationAlarm from './alarm-factories/create-memory-utilization-alarm';
import createNetworkRxBytesAlarm from './alarm-factories/create-network-rx-bytes-alarm';
import createNetworkTxBytesAlarm from './alarm-factories/create-network-tx-bytes-alarm';
import createStorageReadBytesAlarm from './alarm-factories/create-storage-read-bytes-alarm';
import createStorageWriteBytesAlarm from './alarm-factories/create-storage-write-bytes-alarm';
import { AsgConfig, ClusterConfig } from './types';

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
    snsTopicArns?: string[];
}

export type EcsClusterAlarmActionValue = (
    name: string,
    threshold: number,
    configs: Record<string, string>,
    snsTopicArns?: string[]
) => aws.cloudwatch.MetricAlarm | undefined;

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

        const { configs, options, snsTopicArns } = args;

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
                snsTopicArns
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
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { asgName } = configs;
        if (!asgName) return undefined;

        const asgConfig: AsgConfig = {
            asgName,
        };

        return createAsgMaxGroupSizeAlarm(name, threshold, asgConfig, {
            parent: this,
            snsTopicArns,
        });
    }

    private createCpuUtilizationAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const clusterConfig: ClusterConfig = {
            clusterName,
        };

        return createCpuUtilizationAlarm(name, threshold, clusterConfig, {
            parent: this,
            snsTopicArns,
        });
    }

    private createMemoryUtilizationAlarm(
        name: string,
        threshold: number,
        configs: Record<string, string>,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const clusterConfig: ClusterConfig = {
            clusterName,
        };

        return createMemoryUtilizationAlarm(name, threshold, clusterConfig, {
            parent: this,
            snsTopicArns,
        });
    }

    private createNetworkRxBytesAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const clusterConfig: ClusterConfig = {
            clusterName,
        };

        return createNetworkRxBytesAlarm(name, threshold, clusterConfig, {
            parent: this,
            snsTopicArns,
        });
    }

    private createNetworkTxBytesAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const clusterConfig: ClusterConfig = {
            clusterName,
        };

        return createNetworkTxBytesAlarm(name, threshold, clusterConfig, {
            parent: this,
            snsTopicArns,
        });
    }

    private createStorageReadBytesAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const clusterConfig: ClusterConfig = {
            clusterName,
        };

        return createStorageReadBytesAlarm(name, threshold, clusterConfig, {
            parent: this,
            snsTopicArns,
        });
    }

    private createStorageWriteBytesAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const clusterConfig: ClusterConfig = {
            clusterName,
        };

        return createStorageWriteBytesAlarm(name, threshold, clusterConfig, {
            parent: this,
            snsTopicArns,
        });
    }
}
