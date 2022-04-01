/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch/widget';
import * as pulumi from '@pulumi/pulumi';

import { ExtraWidgets } from './types';

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
    extraWidgets?: ExtraWidgets;
}

export interface EcsClusterDashboardActionValue {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    run: (...args: any[]) => Widget[];
    args: EcsClusterDashboardConfigKey[];
}

export type EcsClusterDashboardActionDict = {
    [option in EcsClusterDashboardOptionKey]: EcsClusterDashboardActionValue;
};

const fixedPeriod = 60;
const dinamicPeriod = 60;

export default class EcsClusterDashboard extends pulumi.ComponentResource {
    readonly dashboard: awsx.cloudwatch.Dashboard;

    static readonly actionDict: EcsClusterDashboardActionDict = {
        task: {
            run: EcsClusterDashboard.createTaskCountWidgets,
            args: ['clusterName', 'asgName'],
        },
        hardware: {
            run: EcsClusterDashboard.createMemoryAndCpuUtizilationWidgets,
            args: ['clusterName'],
        },
        inputOutputRate: {
            run: EcsClusterDashboard.createNetworkAndStorageRateWidgets,
            args: ['clusterName'],
        },
        inputOutputBytes: {
            run: EcsClusterDashboard.createNetworkAndStorageIoBytesWidgets,
            args: ['asgName'],
        },
        inputOutputCount: {
            run: EcsClusterDashboard.createNetworkAndStorageIoCountWidgets,
            args: ['asgName'],
        },
    };

    constructor(name: string, args: EcsClusterDashboardArgs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:EcsClusterDashboard', name, {}, opts);

        const { configs, defaultOptions, options, extraWidgets } = args;

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
                .map((option) =>
                    EcsClusterDashboard.actionDict[option].run(
                        ...EcsClusterDashboard.actionDict[option].args.map(
                            (argName) => configs[argName]
                        )
                    )
                )
                .flat()
        );
        /* eslint-enable security/detect-object-injection */

        widgets.push(...(extraWidgets?.end || []));

        this.dashboard = new awsx.cloudwatch.Dashboard(name, { widgets }, { parent: this });
    }

    static createTaskCountWidgets(clusterName?: string, asgName?: string): Widget[] {
        if (asgName) {
            return EcsClusterDashboard.createInstanceAndTaskCountWidgets(clusterName, asgName);
        }

        return EcsClusterDashboard.createOnlyTaskCountWidgets(clusterName);
    }

    static createInstanceAndTaskCountWidgets(clusterName?: string, asgName?: string): Widget[] {
        if (!clusterName || !asgName) return [];

        const asgInServiceInstancesMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            name: 'GroupInServiceInstances',
            label: 'GroupInServiceInstances',
            dimensions: { AutoScalingGroupName: asgName },
            statistic: 'Maximum',
        });

        const asgDesiredCapacityMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            name: 'GroupInServiceInstances',
            label: 'GroupInServiceInstances',
            dimensions: { AutoScalingGroupName: asgName },
            statistic: 'Maximum',
        });

        const asgMaxSizeMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            name: 'GroupMaxSize',
            label: 'GroupMaxSize',
            dimensions: { AutoScalingGroupName: asgName },
            statistic: 'Maximum',
        });

        const serviceCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'ServiceCount',
            label: 'ServiceCount',
            dimensions: { ClusterName: clusterName },
            statistic: 'Maximum',
        });

        const taskCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'TaskCount',
            label: 'TaskCount',
            dimensions: { ClusterName: clusterName },
            statistic: 'Maximum',
        });

        return [
            new awsx.cloudwatch.SingleNumberMetricWidget({
                title: 'Instance Count Status',
                width: 3,
                height: 6,
                metrics: [
                    asgInServiceInstancesMetric.withPeriod(fixedPeriod),
                    asgMaxSizeMetric.withPeriod(fixedPeriod),
                ],
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: `Instance Count History (${asgName})`,
                width: 9,
                height: 6,
                metrics: [
                    asgDesiredCapacityMetric.withPeriod(dinamicPeriod),
                    asgInServiceInstancesMetric.withPeriod(dinamicPeriod),
                ],
            }),
            new awsx.cloudwatch.SingleNumberMetricWidget({
                title: 'Task Count Status',
                width: 3,
                height: 6,
                metrics: [
                    serviceCountMetric.withPeriod(fixedPeriod),
                    taskCountMetric.withPeriod(fixedPeriod),
                ],
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: `Task Count History (${clusterName})`,
                width: 9,
                height: 6,
                metrics: [taskCountMetric.withPeriod(dinamicPeriod)],
            }),
        ];
    }

    static createOnlyTaskCountWidgets(clusterName?: string): Widget[] {
        if (!clusterName) return [];

        const serviceCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'ServiceCount',
            label: 'ServiceCount',
            dimensions: { ClusterName: clusterName },
            statistic: 'Maximum',
        });

        const taskCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'TaskCount',
            label: 'TaskCount',
            dimensions: { ClusterName: clusterName },
            statistic: 'Maximum',
        });

        return [
            new awsx.cloudwatch.SingleNumberMetricWidget({
                title: 'Task Count Status',
                width: 6,
                height: 4,
                metrics: [
                    serviceCountMetric.withPeriod(fixedPeriod),
                    taskCountMetric.withPeriod(fixedPeriod),
                ],
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: `Task Count History (${clusterName})`,
                width: 18,
                height: 4,
                metrics: [taskCountMetric.withPeriod(dinamicPeriod)],
            }),
        ];
    }

    static createMemoryAndCpuUtizilationWidgets(clusterName?: string): Widget[] {
        if (!clusterName) return [];

        const memoryUtilizationMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ECS',
            name: 'MemoryUtilization',
            label: 'MemoryUtilization',
            dimensions: { ClusterName: clusterName },
            statistic: 'Average',
        });

        const memoryAnomalyDetectionExpression = new awsx.cloudwatch.ExpressionWidgetMetric(
            'ANOMALY_DETECTION_BAND(m1, 2)',
            'AnomalyDetectionBand',
            'e1'
        );

        const cpuUtilizationMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ECS',
            name: 'CPUUtilization',
            label: 'CPUUtilization',
            dimensions: { ClusterName: clusterName },
            statistic: 'Average',
        });

        const cpuAnomalyDetectionExpression = new awsx.cloudwatch.ExpressionWidgetMetric(
            'ANOMALY_DETECTION_BAND(m1, 2)',
            'AnomalyDetectionBand',
            'e1'
        );

        return [
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Memory Utilization',
                width: 12,
                height: 6,
                period: dinamicPeriod,
                metrics: [
                    memoryAnomalyDetectionExpression,
                    memoryUtilizationMetric.withId('m1').withPeriod(dinamicPeriod),
                ],
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'CPU Utilization',
                width: 12,
                height: 6,
                period: dinamicPeriod,
                metrics: [
                    cpuAnomalyDetectionExpression,
                    cpuUtilizationMetric.withId('m1').withPeriod(dinamicPeriod),
                ],
            }),
        ];
    }

    static createNetworkAndStorageRateWidgets(clusterName?: string): Widget[] {
        if (!clusterName) return [];

        const networkTxBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'NetworkTxBytes',
            label: 'NetworkTxBytes',
            dimensions: { ClusterName: clusterName },
            statistic: 'Average',
        });

        const networkRxBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'NetworkRxBytes',
            label: 'NetworkRxBytes',
            dimensions: { ClusterName: clusterName },
            statistic: 'Average',
        });

        const storageWriteBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'StorageWriteBytes',
            label: 'StorageWriteBytes',
            dimensions: { ClusterName: clusterName },
            statistic: 'Average',
        });

        const storageReadBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'StorageReadBytes',
            label: 'StorageReadBytes',
            dimensions: { ClusterName: clusterName },
            statistic: 'Average',
        });

        return [
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Network Rate',
                width: 12,
                height: 6,
                metrics: [
                    networkTxBytesMetric.withPeriod(dinamicPeriod),
                    networkRxBytesMetric.withPeriod(dinamicPeriod),
                ],
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Storage Rate',
                width: 12,
                height: 6,
                metrics: [
                    storageWriteBytesMetric.withPeriod(dinamicPeriod),
                    storageReadBytesMetric.withPeriod(dinamicPeriod),
                ],
            }),
        ];
    }

    static createNetworkAndStorageIoBytesWidgets(asgName?: string): Widget[] {
        if (!asgName) return [];

        const networkOutMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/EC2',
            name: 'NetworkOut',
            label: 'NetworkOut',
            dimensions: { AutoScalingGroupName: asgName },
            statistic: 'Average',
        });

        const networkInMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/EC2',
            name: 'NetworkIn',
            label: 'NetworkIn',
            dimensions: { AutoScalingGroupName: asgName },
            statistic: 'Average',
        });

        const ebsWriteBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/EC2',
            name: 'EBSWriteBytes',
            label: 'EBSWriteBytes',
            dimensions: { AutoScalingGroupName: asgName },
            statistic: 'Average',
        });

        const ebsReadBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/EC2',
            name: 'EBSReadBytes',
            label: 'EBSReadBytes',
            dimensions: { AutoScalingGroupName: asgName },
            statistic: 'Average',
        });

        return [
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Network IO (bytes)',
                width: 12,
                height: 6,
                metrics: [
                    networkOutMetric.withPeriod(dinamicPeriod),
                    networkInMetric.withPeriod(dinamicPeriod),
                ],
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Storage IO (bytes)',
                width: 12,
                height: 6,
                metrics: [
                    ebsWriteBytesMetric.withPeriod(dinamicPeriod),
                    ebsReadBytesMetric.withPeriod(dinamicPeriod),
                ],
            }),
        ];
    }

    static createNetworkAndStorageIoCountWidgets(asgName?: string): Widget[] {
        if (!asgName) return [];

        const networkPacketsOutMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/EC2',
            name: 'NetworkPacketsOut',
            label: 'NetworkPacketsOut',
            dimensions: { AutoScalingGroupName: asgName },
            statistic: 'Average',
        });

        const networkPacketsInMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/EC2',
            name: 'NetworkPacketsIn',
            label: 'NetworkPacketsIn',
            dimensions: { AutoScalingGroupName: asgName },
            statistic: 'Average',
        });

        const ebsWriteOpsMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/EC2',
            name: 'EBSWriteOps',
            label: 'EBSWriteOps',
            dimensions: { AutoScalingGroupName: asgName },
            statistic: 'Average',
        });

        const ebsReadOpsMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/EC2',
            name: 'EBSReadOps',
            label: 'EBSReadOps',
            dimensions: { AutoScalingGroupName: asgName },
            statistic: 'Average',
        });

        return [
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Network IO (count)',
                width: 12,
                height: 6,
                metrics: [
                    networkPacketsOutMetric.withPeriod(dinamicPeriod),
                    networkPacketsInMetric.withPeriod(dinamicPeriod),
                ],
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Storage IO (count)',
                width: 12,
                height: 6,
                metrics: [
                    ebsWriteOpsMetric.withPeriod(dinamicPeriod),
                    ebsReadOpsMetric.withPeriod(dinamicPeriod),
                ],
            }),
        ];
    }
}
