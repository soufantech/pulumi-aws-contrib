/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch/widget';
import * as pulumi from '@pulumi/pulumi';

import { ExtraWidgets } from './types';

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

export interface EcsServiceDashboardActionValue {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    run: (...args: any[]) => Widget[];
    args: EcsServiceDashboardConfigKey[];
}

export type EcsServiceDashboardActionDict = {
    [option in EcsServiceDashboardOptionKey]: EcsServiceDashboardActionValue;
};

const fixedPeriod = 60;
const dinamicPeriod = 60;

export default class EcsServiceDashboard extends pulumi.ComponentResource {
    readonly dashboard: awsx.cloudwatch.Dashboard;

    static readonly actionDict: EcsServiceDashboardActionDict = {
        task: {
            run: EcsServiceDashboard.createTaskCountWidgets,
            args: ['clusterName', 'serviceName', 'asgName'],
        },
        health: {
            run: EcsServiceDashboard.createUptimeAndHealthyStatusWidgets,
            args: ['loadBalancer', 'targetGroup'],
        },
        request: {
            run: EcsServiceDashboard.createLatencyAndRequestCountWidgets,
            args: ['loadBalancer', 'targetGroup'],
        },
        hardware: {
            run: EcsServiceDashboard.createMemoryAndCpuUtizilationWidgets,
            args: ['clusterName', 'serviceName'],
        },
        hardwareExtra: {
            run: EcsServiceDashboard.createMemoryAndCpuExtraInfoWidgets,
            args: ['clusterName', 'serviceName'],
        },
        inputOutput: {
            run: EcsServiceDashboard.createNetworkAndStorageWidgets,
            args: ['clusterName', 'serviceName'],
        },
    };

    constructor(name: string, args: EcsServiceDashboardArgs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:EcsServiceDashboard', name, {}, opts);

        const { configs, options, defaultOptions, extraWidgets } = args;

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
                .map((option) =>
                    EcsServiceDashboard.actionDict[option].run(
                        ...EcsServiceDashboard.actionDict[option].args.map(
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

    static createTaskCountWidgets(
        clusterName?: string,
        serviceName?: string,
        asgName?: string
    ): Widget[] {
        if (asgName) {
            return EcsServiceDashboard.createInstanceAndTaskCountWidgets(
                clusterName,
                serviceName,
                asgName
            );
        }

        return EcsServiceDashboard.createOnlyTaskCountWidgets(clusterName, serviceName);
    }

    static createInstanceAndTaskCountWidgets(
        clusterName?: string,
        serviceName?: string,
        asgName?: string
    ): Widget[] {
        if (!clusterName || !serviceName || !asgName) return [];

        const asgInServiceInstancesMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            name: 'GroupInServiceInstances',
            label: 'GroupInServiceInstances',
            dimensions: { AutoScalingGroupName: asgName },
            statistic: 'Maximum',
        });

        const asgDesiredCapacityMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            name: 'GroupDesiredCapacity',
            label: 'GroupDesiredCapacity',
            dimensions: { AutoScalingGroupName: asgName },
            statistic: 'Maximum',
        });

        const desiredTaskCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'DesiredTaskCount',
            label: 'DesiredTaskCount',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
            statistic: 'Maximum',
        });

        const pendingTaskCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'PendingTaskCount',
            label: 'PendingTaskCount',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
            statistic: 'Maximum',
        });

        const runningTaskCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'RunningTaskCount',
            label: 'RunningTaskCount',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
            statistic: 'Maximum',
        });

        return [
            new awsx.cloudwatch.SingleNumberMetricWidget({
                title: 'Instance Count',
                width: 3,
                height: 6,
                metrics: [
                    asgInServiceInstancesMetric.withPeriod(fixedPeriod),
                    runningTaskCountMetric.withPeriod(fixedPeriod),
                ],
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Instance Count History',
                width: 9,
                height: 6,
                metrics: [
                    asgDesiredCapacityMetric.withPeriod(dinamicPeriod),
                    asgInServiceInstancesMetric.withPeriod(dinamicPeriod),
                ],
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Task Count History',
                width: 12,
                height: 6,
                metrics: [
                    desiredTaskCountMetric.withPeriod(dinamicPeriod),
                    pendingTaskCountMetric.withPeriod(dinamicPeriod),
                    runningTaskCountMetric.withPeriod(dinamicPeriod),
                ],
            }),
        ];
    }

    static createOnlyTaskCountWidgets(clusterName?: string, serviceName?: string): Widget[] {
        if (!clusterName || !serviceName) return [];

        const desiredTaskCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'DesiredTaskCount',
            label: 'DesiredTaskCount',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
            statistic: 'Maximum',
        });

        const pendingTaskCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'PendingTaskCount',
            label: 'PendingTaskCount',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
            statistic: 'Maximum',
        });

        const runningTaskCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'RunningTaskCount',
            label: 'RunningTaskCount',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
            statistic: 'Maximum',
        });

        return [
            new awsx.cloudwatch.SingleNumberMetricWidget({
                title: 'Instance Count',
                width: 3,
                height: 4,
                metrics: [runningTaskCountMetric.withPeriod(fixedPeriod)],
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Task Count History',
                width: 21,
                height: 4,
                metrics: [
                    desiredTaskCountMetric.withPeriod(dinamicPeriod),
                    pendingTaskCountMetric.withPeriod(dinamicPeriod),
                    runningTaskCountMetric.withPeriod(dinamicPeriod),
                ],
            }),
        ];
    }

    static createUptimeAndHealthyStatusWidgets(
        loadBalancer?: string,
        targetGroup?: string
    ): Widget[] {
        if (!loadBalancer || !targetGroup) return [];

        const requestCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'RequestCount',
            label: 'RequestCount',
            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
            statistic: 'SampleCount',
        });

        const httpCodeTarget5xxCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'HTTPCode_Target_5XX_Count',
            label: 'HTTPCode_Target_5XX_Count',
            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
            statistic: 'SampleCount',
        });

        const uptimeExpression = new awsx.cloudwatch.ExpressionWidgetMetric(
            '(1-(m2/m1))*100',
            'Uptime',
            'e1'
        );

        const healthyHostCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'HealthyHostCount',
            label: 'HealthyHostCount',
            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
            statistic: 'Maximum',
        });

        const unhealthyHostCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'UnHealthyHostCount',
            label: 'UnHealthyHostCount',
            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
            statistic: 'Maximum',
        });

        const healthyRateExpression = new awsx.cloudwatch.ExpressionWidgetMetric(
            '(1-(m2/m1))*100',
            'HealthyRate',
            'e1'
        );

        return [
            new awsx.cloudwatch.SingleNumberMetricWidget({
                title: 'Uptime Status',
                width: 3,
                height: 4,
                period: fixedPeriod,
                metrics: [
                    uptimeExpression,
                    requestCountMetric.withId('m1').withPeriod(fixedPeriod).withVisible(false),
                    httpCodeTarget5xxCountMetric
                        .withId('m2')
                        .withPeriod(fixedPeriod)
                        .withVisible(false),
                ],
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Uptime History',
                width: 9,
                height: 4,
                period: dinamicPeriod,
                metrics: [
                    uptimeExpression,
                    requestCountMetric.withId('m1').withPeriod(dinamicPeriod).withVisible(false),
                    httpCodeTarget5xxCountMetric
                        .withId('m2')
                        .withPeriod(dinamicPeriod)
                        .withVisible(false),
                ],
            }),
            new awsx.cloudwatch.SingleNumberMetricWidget({
                title: 'Healthy Status',
                width: 6,
                height: 4,
                period: fixedPeriod,
                metrics: [
                    healthyHostCountMetric.withPeriod(fixedPeriod),
                    unhealthyHostCountMetric.withPeriod(fixedPeriod),
                ],
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Healthy History',
                width: 6,
                height: 4,
                period: dinamicPeriod,
                metrics: [
                    healthyRateExpression,
                    healthyHostCountMetric
                        .withId('m1')
                        .withPeriod(dinamicPeriod)
                        .withVisible(false),
                    unhealthyHostCountMetric
                        .withId('m2')
                        .withPeriod(dinamicPeriod)
                        .withVisible(false),
                ],
            }),
        ];
    }

    static createLatencyAndRequestCountWidgets(
        loadBalancer?: string,
        targetGroup?: string
    ): Widget[] {
        if (!loadBalancer || !targetGroup) return [];

        const latencyWarning = 0.3;
        const latencyAlarm = 0.5;

        const targetResponseTimeMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'TargetResponseTime',
            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
        });

        const requestCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'RequestCount',
            label: 'RequestCount',
            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
            statistic: 'Sum',
        });

        const httpCodeTarget5xxCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'HTTPCode_Target_5XX_Count',
            label: 'HTTPCode_Target_5XX_Count',
            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
            statistic: 'Sum',
        });

        const httpCodeTarget4xxCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'HTTPCode_Target_4XX_Count',
            label: 'HTTPCode_Target_4XX_Count',
            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
            statistic: 'Sum',
        });

        const httpCodeTarget3xxCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'HTTPCode_Target_3XX_Count',
            label: 'HTTPCode_Target_3XX_Count',
            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
            statistic: 'Sum',
        });

        const httpCodeTarget2xxCountMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'HTTPCode_Target_2XX_Count',
            label: 'HTTPCode_Target_2XX_Count',
            dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
            statistic: 'Sum',
        });

        const warningColor = '#ff7f0e';
        const alarmColor = '#d62728';
        const annotations = [];

        if (latencyWarning) {
            annotations.push(
                new awsx.cloudwatch.HorizontalAnnotation({
                    aboveEdge: { label: 'In warning', value: latencyWarning },
                    color: warningColor,
                })
            );
        }

        if (latencyAlarm) {
            annotations.push(
                new awsx.cloudwatch.HorizontalAnnotation({
                    aboveEdge: { label: 'In alarm', value: latencyAlarm },
                    color: alarmColor,
                })
            );
        }

        return [
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Target Group Latency',
                width: 12,
                height: 6,
                annotations,
                metrics: [
                    targetResponseTimeMetric
                        .withPeriod(dinamicPeriod)
                        .withStatistic('Minimum')
                        .withLabel('TargetResponseTime Minimum'),
                    targetResponseTimeMetric
                        .withPeriod(dinamicPeriod)
                        .withStatistic('Average')
                        .withLabel('TargetResponseTime Average'),
                    targetResponseTimeMetric
                        .withPeriod(dinamicPeriod)
                        .withStatistic('Maximum')
                        .withLabel('TargetResponseTime Maximum'),
                    targetResponseTimeMetric
                        .withPeriod(dinamicPeriod)
                        .withExtendedStatistic(50)
                        .withLabel('TargetResponseTime p50'),
                    targetResponseTimeMetric
                        .withPeriod(dinamicPeriod)
                        .withExtendedStatistic(90)
                        .withLabel('TargetResponseTime p90'),
                    targetResponseTimeMetric
                        .withPeriod(dinamicPeriod)
                        .withExtendedStatistic(99)
                        .withLabel('TargetResponseTime p99'),
                ],
            }),
            new awsx.cloudwatch.StackedAreaGraphMetricWidget({
                title: 'Request Count',
                width: 12,
                height: 6,
                metrics: [
                    requestCountMetric.withPeriod(dinamicPeriod).withYAxis('right'),
                    httpCodeTarget5xxCountMetric.withPeriod(dinamicPeriod),
                    httpCodeTarget4xxCountMetric.withPeriod(dinamicPeriod),
                    httpCodeTarget3xxCountMetric.withPeriod(dinamicPeriod),
                    httpCodeTarget2xxCountMetric.withPeriod(dinamicPeriod),
                ],
            }),
        ];
    }

    static createMemoryAndCpuUtizilationWidgets(
        clusterName?: string,
        serviceName?: string
    ): Widget[] {
        if (!clusterName || !serviceName) return [];

        const memoryUtilizationMetric = new awsx.cloudwatch.Metric({
            namespace: 'AWS/ECS',
            name: 'MemoryUtilization',
            label: 'MemoryUtilization',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
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
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
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

    static createMemoryAndCpuExtraInfoWidgets(
        clusterName?: string,
        serviceName?: string
    ): Widget[] {
        if (!clusterName || !serviceName) return [];

        const memoryReservedMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'MemoryReserved',
            label: 'MemoryReserved',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
            statistic: 'Average',
        });

        const memoryUtilizedMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'MemoryUtilized',
            label: 'MemoryUtilized',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
            statistic: 'Average',
        });

        const memoryOverflowExpression = new awsx.cloudwatch.ExpressionWidgetMetric(
            'm2-m1',
            'MemoryOverflow',
            'e1'
        );

        const cpuReservedMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'CpuReserved',
            label: 'CpuReserved',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
            statistic: 'Average',
        });

        const cpuUtilizedMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'CpuUtilized',
            label: 'CpuUtilized',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
            statistic: 'Average',
        });

        const cpuOverflowExpression = new awsx.cloudwatch.ExpressionWidgetMetric(
            'm2-m1',
            'CpuOverflow',
            'e1'
        );

        return [
            new awsx.cloudwatch.SingleNumberMetricWidget({
                title: 'Memory Status',
                width: 3,
                height: 6,
                metrics: [
                    memoryReservedMetric.withPeriod(fixedPeriod),
                    memoryUtilizedMetric.withPeriod(fixedPeriod),
                ],
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Memory Overflow',
                width: 9,
                height: 6,
                period: dinamicPeriod,
                metrics: [
                    memoryOverflowExpression,
                    memoryReservedMetric.withId('m1').withPeriod(dinamicPeriod).withVisible(false),
                    memoryUtilizedMetric.withId('m2').withPeriod(dinamicPeriod).withVisible(false),
                ],
            }),
            new awsx.cloudwatch.SingleNumberMetricWidget({
                title: 'CPU Status',
                width: 3,
                height: 6,
                metrics: [
                    cpuReservedMetric.withPeriod(fixedPeriod),
                    cpuUtilizedMetric.withPeriod(fixedPeriod),
                ],
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'CPU Overflow',
                width: 9,
                height: 6,
                period: dinamicPeriod,
                metrics: [
                    cpuOverflowExpression,
                    cpuReservedMetric.withId('m1').withPeriod(dinamicPeriod).withVisible(false),
                    cpuUtilizedMetric.withId('m2').withPeriod(dinamicPeriod).withVisible(false),
                ],
            }),
        ];
    }

    static createNetworkAndStorageWidgets(clusterName?: string, serviceName?: string): Widget[] {
        if (!clusterName || !serviceName) return [];

        const networkTxBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'NetworkTxBytes',
            label: 'NetworkTxBytes',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
            statistic: 'Average',
        });

        const networkRxBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'NetworkRxBytes',
            label: 'NetworkRxBytes',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
            statistic: 'Average',
        });

        const storageWriteBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'StorageWriteBytes',
            label: 'StorageWriteBytes',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
            statistic: 'Average',
        });

        const storageReadBytesMetric = new awsx.cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            name: 'StorageReadBytes',
            label: 'StorageReadBytes',
            dimensions: { ClusterName: clusterName, ServiceName: serviceName },
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
}
