/* eslint-disable sonarjs/no-duplicate-string */
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';

export type EcsServiceAlarmConfigKey = 'clusterName' | 'serviceName' | 'loadBalancer' | 'targetGroup';

export type EcsServiceAlarmConfig = {
    [config in EcsServiceAlarmConfigKey]?: string;
};

export type EcsServiceAlarmOptionKey =
    | 'uptime'
    | 'targetResponseTime'
    | 'requestCount'
    | 'requestSpikeCount'
    | 'memoryUtilization'
    | 'cpuUtilization'
    | 'networkTxBytes'
    | 'networkRxBytes'
    | 'storageWriteBytes'
    | 'storageReadBytes';

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

export type EcsServiceAlarmActionValue = (
    name: string,
    threshold: number,
    config: EcsServiceAlarmConfig,
    snsTopicArns?: string[]
) => aws.cloudwatch.MetricAlarm | undefined;

export type EcsServiceAlarmActionDict = {
    [option in EcsServiceAlarmOptionKey]: EcsServiceAlarmActionValue;
};

const shortPeriod = 60;
const longPeriod = 300;
const datapoints = 6;

export default class EcsServiceAlarm extends pulumi.ComponentResource {
    readonly alarms?: EcsServiceAlarmResult;

    readonly actionDict: EcsServiceAlarmActionDict = {
        uptime: this.createUptimeAlarm,
        targetResponseTime: this.createTargetResponseTimeAlarm,
        requestCount: this.createRequestCountAlarm,
        requestSpikeCount: this.createRequestSpikeCountAlarm,
        memoryUtilization: this.createMemoryUtilizationAlarm,
        cpuUtilization: this.createCpuUtilizationAlarm,
        networkTxBytes: this.createNetworkTxBytesAlarm,
        networkRxBytes: this.createNetworkRxBytesAlarm,
        storageWriteBytes: this.createStorageWriteBytesAlarm,
        storageReadBytes: this.createStorageReadBytesAlarm,
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
        configs: EcsServiceAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { loadBalancer, targetGroup } = configs;
        if (!loadBalancer || !targetGroup) return undefined;

        return new aws.cloudwatch.MetricAlarm(
            `${name}-uptime`,
            {
                comparisonOperator: 'LessThanOrEqualToThreshold',
                threshold,
                evaluationPeriods: datapoints,
                metricQueries: [
                    {
                        id: 'e1',
                        expression: '(1-(m2/m1))*100',
                        label: 'Uptime',
                        returnData: true,
                    },
                    {
                        id: 'm1',
                        metric: {
                            namespace: 'AWS/ApplicationELB',
                            metricName: 'RequestCount',
                            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
                            stat: 'Sum',
                            period: shortPeriod,
                        },
                    },
                    {
                        id: 'm2',
                        metric: {
                            namespace: 'AWS/ApplicationELB',
                            metricName: 'HTTPCode_ELB_5XX_Count',
                            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
                            stat: 'Sum',
                            period: shortPeriod,
                        },
                    },
                ],
                alarmActions: snsTopicArns,
                okActions: snsTopicArns,
            },
            { parent: this }
        );
    }

    private createTargetResponseTimeAlarm(
        name: string,
        threshold: number,
        configs: EcsServiceAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { loadBalancer, targetGroup } = configs;
        if (!loadBalancer || !targetGroup) return undefined;

        const targetResponseTimeMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'TargetResponseTime',
            label: 'TargetResponseTime',
            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
            statistic: 'Average',
            period: shortPeriod,
        });

        return targetResponseTimeMetric.createAlarm(
            `${name}-target-response-time`,
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

    private createRequestCountAlarm(
        name: string,
        threshold: number,
        configs: EcsServiceAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { loadBalancer, targetGroup } = configs;
        if (!loadBalancer || !targetGroup) return undefined;

        const requestCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'RequestCount',
            label: 'RequestCount',
            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
            statistic: 'Sum',
            period: longPeriod,
        });

        return requestCountMetric.createAlarm(
            `${name}-request-count`,
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

    private createRequestSpikeCountAlarm(
        name: string,
        threshold: number,
        configs: EcsServiceAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { loadBalancer, targetGroup } = configs;
        if (!loadBalancer || !targetGroup) return undefined;

        const requestCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'RequestCount',
            label: 'RequestCount',
            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
            statistic: 'Sum',
            period: longPeriod,
        });

        return requestCountMetric.createAlarm(
            `${name}-request-spike-count`,
            {
                comparisonOperator: 'GreaterThanOrEqualToThreshold',
                threshold,
                evaluationPeriods: 1,
                alarmActions: snsTopicArns,
                okActions: snsTopicArns,
            },
            { parent: this }
        );
    }

    private createMemoryUtilizationAlarm(
        name: string,
        threshold: number,
        configs: EcsServiceAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return undefined;

        const memoryUtilization = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ECS',
            name: 'MemoryUtilization',
            label: 'MemoryUtilization',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
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
        configs: EcsServiceAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return undefined;

        const cpuUtilization = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ECS',
            name: 'CPUUtilization',
            label: 'CPUUtilization',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
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
        configs: EcsServiceAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return undefined;

        const networkTxBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'NetworkTxBytes',
            label: 'NetworkTxBytes',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
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
        configs: EcsServiceAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return undefined;

        const networkRxBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'NetworkRxBytes',
            label: 'NetworkRxBytes',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
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
        configs: EcsServiceAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return undefined;

        const storageWriteBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'StorageWriteBytes',
            label: 'StorageWriteBytes',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
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
        configs: EcsServiceAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { clusterName, serviceName } = configs;
        if (!clusterName || !serviceName) return undefined;

        const storageReadBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'StorageReadBytes',
            label: 'StorageReadBytes',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
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
