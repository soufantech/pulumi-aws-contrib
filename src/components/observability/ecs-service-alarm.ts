import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import { ecsServiceAlarm, tgAlarm } from './alarm-factories';
import { TargetGroupConfig, EcsServiceConfig, WrapperAlarmFactory } from './types';

export type EcsServiceAlarmConfigKey =
    | 'clusterName'
    | 'serviceName'
    | 'loadBalancer'
    | 'targetGroup';

export type EcsServiceAlarmConfig = {
    [config in EcsServiceAlarmConfigKey]?: string;
};

export type EcsServiceAlarmOptionKey =
    | 'uptime'
    | 'targetResponseTime'
    | 'requestCount'
    | 'requestSpikeCount'
    | 'cpuUtilization'
    | 'memoryUtilization'
    | 'networkRxBytes'
    | 'networkTxBytes'
    | 'storageReadBytes'
    | 'storageWriteBytes';

export type EcsServiceAlarmOption = {
    [option in EcsServiceAlarmOptionKey]?: number;
};

export type EcsServiceAlarmResult = {
    [option in EcsServiceAlarmOptionKey]?: aws.cloudwatch.MetricAlarm;
};

export interface EcsServiceAlarmArgs {
    configs: EcsServiceAlarmConfig;
    options: EcsServiceAlarmOption;
    snsTopicArns?: string[];
}

export type EcsServiceAlarmActionValue = WrapperAlarmFactory;

export type EcsServiceAlarmActionDict = {
    [option in EcsServiceAlarmOptionKey]: EcsServiceAlarmActionValue;
};

export default class EcsServiceAlarm extends pulumi.ComponentResource {
    readonly alarms?: EcsServiceAlarmResult;

    readonly actionDict: EcsServiceAlarmActionDict = {
        uptime: this.createUptimeAlarm,
        targetResponseTime: this.createTargetResponseTimeAlarm,
        requestCount: this.createRequestCountAlarm,
        requestSpikeCount: this.createRequestSpikeCountAlarm,
        cpuUtilization: this.createCpuUtilizationAlarm,
        memoryUtilization: this.createMemoryUtilizationAlarm,
        networkRxBytes: this.createNetworkRxBytesAlarm,
        networkTxBytes: this.createNetworkTxBytesAlarm,
        storageReadBytes: this.createStorageReadBytesAlarm,
        storageWriteBytes: this.createStorageWriteBytesAlarm,
    };

    constructor(name: string, args: EcsServiceAlarmArgs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:EcsServiceAlarm', name, {}, opts);

        const { configs, options, snsTopicArns } = args;

        const alarms: EcsServiceAlarmResult = {};

        const optionKeys = Object.keys(options) as EcsServiceAlarmOptionKey[];

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

    private createUptimeAlarm(
        name: string,
        threshold: number,
        configs: Record<string, string>,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { loadBalancer, targetGroup } = configs;
        if (!loadBalancer || !targetGroup) return undefined;

        const tgConfig: TargetGroupConfig = {
            loadBalancer,
            targetGroup,
        };

        return tgAlarm.createUptimeAlarm(name, threshold, tgConfig, {
            parent: this,
            snsTopicArns,
        });
    }

    private createTargetResponseTimeAlarm(
        name: string,
        threshold: number,
        configs: Record<string, string>,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { loadBalancer, targetGroup } = configs;
        if (!loadBalancer || !targetGroup) return undefined;

        const tgConfig: TargetGroupConfig = {
            loadBalancer,
            targetGroup,
        };

        return tgAlarm.createTargetResponseTimeAlarm(name, threshold, tgConfig, {
            parent: this,
            snsTopicArns,
        });
    }

    private createRequestCountAlarm(
        name: string,
        threshold: number,
        configs: Record<string, string>,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { loadBalancer, targetGroup } = configs;
        if (!loadBalancer || !targetGroup) return undefined;

        const tgConfig: TargetGroupConfig = {
            loadBalancer,
            targetGroup,
        };

        return tgAlarm.createRequestCountAlarm(name, threshold, tgConfig, {
            parent: this,
            snsTopicArns,
        });
    }

    private createRequestSpikeCountAlarm(
        name: string,
        threshold: number,
        configs: Record<string, string>,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { loadBalancer, targetGroup } = configs;
        if (!loadBalancer || !targetGroup) return undefined;

        const tgConfig: TargetGroupConfig = {
            loadBalancer,
            targetGroup,
        };

        return tgAlarm.createRequestSpikeCountAlarm(name, threshold, tgConfig, {
            parent: this,
            snsTopicArns,
        });
    }

    private createCpuUtilizationAlarm(
        name: string,
        threshold: number,
        configs: Record<string, string>,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return undefined;

        const clusterConfig: EcsServiceConfig = {
            clusterName,
            serviceName,
        };

        return ecsServiceAlarm.createCpuUtilizationAlarm(name, threshold, clusterConfig, {
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
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return undefined;

        const clusterConfig: EcsServiceConfig = {
            clusterName,
            serviceName,
        };

        return ecsServiceAlarm.createMemoryUtilizationAlarm(name, threshold, clusterConfig, {
            parent: this,
            snsTopicArns,
        });
    }

    private createNetworkRxBytesAlarm(
        name: string,
        threshold: number,
        configs: Record<string, string>,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return undefined;

        const clusterConfig: EcsServiceConfig = {
            clusterName,
            serviceName,
        };

        return ecsServiceAlarm.createNetworkRxBytesAlarm(name, threshold, clusterConfig, {
            parent: this,
            snsTopicArns,
        });
    }

    private createNetworkTxBytesAlarm(
        name: string,
        threshold: number,
        configs: Record<string, string>,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return undefined;

        const clusterConfig: EcsServiceConfig = {
            clusterName,
            serviceName,
        };

        return ecsServiceAlarm.createNetworkTxBytesAlarm(name, threshold, clusterConfig, {
            parent: this,
            snsTopicArns,
        });
    }

    private createStorageReadBytesAlarm(
        name: string,
        threshold: number,
        configs: Record<string, string>,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return undefined;

        const clusterConfig: EcsServiceConfig = {
            clusterName,
            serviceName,
        };

        return ecsServiceAlarm.createStorageReadBytesAlarm(name, threshold, clusterConfig, {
            parent: this,
            snsTopicArns,
        });
    }

    private createStorageWriteBytesAlarm(
        name: string,
        threshold: number,
        configs: Record<string, string>,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return undefined;

        const clusterConfig: EcsServiceConfig = {
            clusterName,
            serviceName,
        };

        return ecsServiceAlarm.createStorageWriteBytesAlarm(name, threshold, clusterConfig, {
            parent: this,
            snsTopicArns,
        });
    }
}
