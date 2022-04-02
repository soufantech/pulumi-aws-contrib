/* eslint-disable sonarjs/no-duplicate-string */
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';

export type EcsClusterAlarmConfigKey = 'clusterName' | 'asgName';

export type EcsClusterAlarmConfig = {
    [config in EcsClusterAlarmConfigKey]?: string;
};

export type EcsClusterAlarmOptionKey =
    | 'asgGroupMaxSize'
    | 'memoryUtilization'
    | 'cpuUtilization'
    | 'networkTxBytes'
    | 'networkRxBytes'
    | 'storageWriteBytes'
    | 'storageReadBytes';

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
    config: EcsClusterAlarmConfig,
    snsTopicArns?: string[]
) => aws.cloudwatch.MetricAlarm | undefined;

export type EcsClusterAlarmActionDict = {
    [option in EcsClusterAlarmOptionKey]: EcsClusterAlarmActionValue;
};

const longPeriod = 300;
const datapoints = 6;

export default class EcsClusterAlarm extends pulumi.ComponentResource {
    readonly alarms?: EcsClusterAlarmResult;

    readonly actionDict: EcsClusterAlarmActionDict = {
        asgGroupMaxSize: this.createAsgMaxGroupSizeAlarm,
        memoryUtilization: this.createMemoryUtilizationAlarm,
        cpuUtilization: this.createCpuUtilizationAlarm,
        networkTxBytes: this.createNetworkTxBytesAlarm,
        networkRxBytes: this.createNetworkRxBytesAlarm,
        storageWriteBytes: this.createStorageWriteBytesAlarm,
        storageReadBytes: this.createStorageReadBytesAlarm,
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
        configs: EcsClusterAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { asgName } = configs;
        if (!asgName) return undefined;

        return new aws.cloudwatch.MetricAlarm(
            `${name}-asg-max-size`,
            {
                comparisonOperator: 'GreaterThanOrEqualToThreshold',
                threshold,
                evaluationPeriods: datapoints,
                metricQueries: [
                    {
                        id: 'e1',
                        expression: '(m1*100)/m2',
                        label: 'AsgMaxSize',
                        returnData: true,
                    },
                    {
                        id: 'm1',
                        metric: {
                            namespace: 'AWS/AutoScaling',
                            metricName: 'GroupInServiceInstances',
                            dimensions: { AutoScalingGroupName: asgName },
                            period: longPeriod,
                            stat: 'Maximum',
                        },
                    },
                    {
                        id: 'm2',
                        metric: {
                            namespace: 'AWS/AutoScaling',
                            metricName: 'GroupMaxSize',
                            dimensions: { AutoScalingGroupName: asgName },
                            period: longPeriod,
                            stat: 'Maximum',
                        },
                    },
                ],
                alarmActions: snsTopicArns,
                okActions: snsTopicArns,
            },
            { parent: this }
        );
    }

    private createMemoryUtilizationAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const memoryUtilization = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ECS',
            name: 'MemoryUtilization',
            label: 'MemoryUtilization',
            dimensions: { ClusterName: clusterName },
            statistic: 'Average',
            period: longPeriod,
        });

        return memoryUtilization.createAlarm(
            `${name}-memory-utilization`,
            {
                comparisonOperator: 'GreaterThanOrEqualToThreshold',
                threshold,
                evaluationPeriods: datapoints,
                okActions: snsTopicArns,
                alarmActions: snsTopicArns,
            },
            { parent: this }
        );
    }

    private createCpuUtilizationAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const cpuUtilization = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ECS',
            name: 'CPUUtilization',
            label: 'CPUUtilization',
            dimensions: { ClusterName: clusterName },
            statistic: 'Average',
            period: longPeriod,
        });

        return cpuUtilization.createAlarm(
            `${name}-cpu-utilization`,
            {
                comparisonOperator: 'GreaterThanOrEqualToThreshold',
                threshold,
                evaluationPeriods: datapoints,
                alarmActions: snsTopicArns,
                okActions: snsTopicArns,
            },
            { parent: this }
        );
    }

    private createNetworkTxBytesAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const networkTxBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'NetworkTxBytes',
            label: 'NetworkTxBytes',
            dimensions: { ClusterName: clusterName },
            statistic: 'Average',
            period: longPeriod,
        });

        return networkTxBytesMetric.createAlarm(
            `${name}-network-tx-bytes`,
            {
                comparisonOperator: 'GreaterThanOrEqualToThreshold',
                threshold,
                evaluationPeriods: datapoints,
                alarmActions: snsTopicArns,
                okActions: snsTopicArns,
            },
            { parent: this }
        );
    }

    private createNetworkRxBytesAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const networkRxBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'NetworkRxBytes',
            label: 'NetworkRxBytes',
            dimensions: { ClusterName: clusterName },
            statistic: 'Average',
            period: longPeriod,
        });

        return networkRxBytesMetric.createAlarm(
            `${name}-network-rx-bytes`,
            {
                comparisonOperator: 'GreaterThanOrEqualToThreshold',
                threshold,
                evaluationPeriods: datapoints,
                alarmActions: snsTopicArns,
                okActions: snsTopicArns,
            },
            { parent: this }
        );
    }

    private createStorageWriteBytesAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const storageWriteBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'StorageWriteBytes',
            label: 'StorageWriteBytes',
            dimensions: { ClusterName: clusterName },
            statistic: 'Average',
            period: longPeriod,
        });

        return storageWriteBytesMetric.createAlarm(
            `${name}-storage-write-bytes`,
            {
                comparisonOperator: 'GreaterThanOrEqualToThreshold',
                threshold,
                evaluationPeriods: datapoints,
                okActions: snsTopicArns,
                alarmActions: snsTopicArns,
            },
            { parent: this }
        );
    }

    private createStorageReadBytesAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName } = configs;
        if (!clusterName) return undefined;

        const storageReadBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'StorageReadBytes',
            label: 'StorageReadBytes',
            dimensions: { ClusterName: clusterName },
            statistic: 'Average',
            period: longPeriod,
        });

        return storageReadBytesMetric.createAlarm(
            `${name}-storage-read-bytes`,
            {
                comparisonOperator: 'GreaterThanOrEqualToThreshold',
                threshold,
                evaluationPeriods: datapoints,
                alarmActions: snsTopicArns,
                okActions: snsTopicArns,
            },
            { parent: this }
        );
    }
}
