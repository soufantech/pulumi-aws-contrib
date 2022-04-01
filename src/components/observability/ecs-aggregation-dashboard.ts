/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch/widget';
import * as pulumi from '@pulumi/pulumi';

import { ExtraWidgets } from './types';

interface ServiceConfig {
    clusterName: string;
    serviceName: string;
}

interface AlbConfig {
    loadBalancer: string;
    targetGroup: string;
}

interface AsgConfig {
    asgName: string;
}

export interface EcsAggregationDashboardServiceConfig {
    serviceConfig: ServiceConfig;
    albConfig?: AlbConfig;
}

export interface EcsAggregationDashboardInstanceConfig {
    asgConfig: AsgConfig;
}

export type EcsAggregationDashboardConfig = {
    services?: EcsAggregationDashboardServiceConfig[];
    instances?: EcsAggregationDashboardInstanceConfig[];
};

export type EcsAggregationDashboardConfigKey = keyof EcsAggregationDashboardConfig;

export type EcsAggregationDashboardOptionKey =
    | 'task'
    | 'health'
    | 'request'
    | 'serviceHardware'
    | 'instanceHardware';

export interface EcsAggregationDashboardArgs {
    services: EcsAggregationDashboardServiceConfig[];
    instances?: EcsAggregationDashboardInstanceConfig[];
    options?: EcsAggregationDashboardOptionKey[];
    defaultOptions?: boolean;
    extraWidgets?: ExtraWidgets;
}

export interface EcsAggregationDashboardActionValue {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    run: (...args: any[]) => Widget[];
    args: EcsAggregationDashboardConfigKey[];
}

export type EcsAggregationDashboardActionDict = {
    [option in EcsAggregationDashboardOptionKey]: EcsAggregationDashboardActionValue;
};

const dinamicPeriod = 60;

export default class EcsAggregationDashboard extends pulumi.ComponentResource {
    readonly dashboard: awsx.cloudwatch.Dashboard;

    static readonly actionDict: EcsAggregationDashboardActionDict = {
        task: {
            run: EcsAggregationDashboard.createTaskCountWidgets,
            args: ['services', 'instances'],
        },
        health: {
            run: EcsAggregationDashboard.createUptimeAndHealthyStatusWidgets,
            args: ['services'],
        },
        request: {
            run: EcsAggregationDashboard.createLatencyAndRequestCountWidgets,
            args: ['services'],
        },
        serviceHardware: {
            run: EcsAggregationDashboard.createServiceMemoryAndCpuUtizilationWidgets,
            args: ['services'],
        },
        instanceHardware: {
            run: EcsAggregationDashboard.createInstanceMemoryAndCpuUtizilationWidgets,
            args: ['services'],
        },
    };

    constructor(name: string, args: EcsAggregationDashboardArgs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:EcsAggregationDashboard', name, {}, opts);

        const { services, instances, options, defaultOptions, extraWidgets } = args;
        const configs = {
            services,
            instances: instances || [],
        };

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
                .map((option) =>
                    EcsAggregationDashboard.actionDict[option].run(
                        ...EcsAggregationDashboard.actionDict[option].args.map(
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
        services?: EcsAggregationDashboardServiceConfig[],
        instances?: EcsAggregationDashboardInstanceConfig[]
    ): Widget[] {
        if (instances?.length) {
            return EcsAggregationDashboard.createInstanceAndTaskCountWidgets(services, instances);
        }

        return EcsAggregationDashboard.createOnlyTaskCountWidgets(services);
    }

    static createInstanceAndTaskCountWidgets(
        services?: EcsAggregationDashboardServiceConfig[],
        instances?: EcsAggregationDashboardInstanceConfig[]
    ): Widget[] {
        if (!services || !instances) return [];

        const asgInServiceInstancesMetrics = instances.map(
            (instance) =>
                new awsx.cloudwatch.Metric({
                    namespace: 'AWS/AutoScaling',
                    name: 'GroupInServiceInstances',
                    label: instance.asgConfig.asgName,
                    dimensions: { AutoScalingGroupName: instance.asgConfig.asgName },
                    statistic: 'Maximum',
                    period: dinamicPeriod,
                })
        );

        const runningTaskCountMetrics = services.map(
            (service) =>
                new awsx.cloudwatch.Metric({
                    namespace: 'ECS/ContainerInsights',
                    name: 'RunningTaskCount',
                    label: service.serviceConfig.serviceName,
                    dimensions: {
                        ClusterName: service.serviceConfig.clusterName,
                        ServiceName: service.serviceConfig.serviceName,
                    },
                    statistic: 'Maximum',
                    period: dinamicPeriod,
                })
        );

        return [
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Instance Count History',
                width: 12,
                height: 6,
                metrics: asgInServiceInstancesMetrics,
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Task Count History',
                width: 12,
                height: 6,
                metrics: runningTaskCountMetrics,
            }),
        ];
    }

    static createOnlyTaskCountWidgets(services?: EcsAggregationDashboardServiceConfig[]): Widget[] {
        if (!services) return [];

        const runningTaskCountMetrics = services.map(
            (service) =>
                new awsx.cloudwatch.Metric({
                    namespace: 'ECS/ContainerInsights',
                    name: 'RunningTaskCount',
                    label: 'RunningTaskCount',
                    dimensions: {
                        ClusterName: service.serviceConfig.clusterName,
                        ServiceName: service.serviceConfig.serviceName,
                    },
                    statistic: 'Maximum',
                    period: dinamicPeriod,
                })
        );

        return [
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Task Count History',
                width: 24,
                height: 6,
                metrics: runningTaskCountMetrics,
            }),
        ];
    }

    static createUptimeAndHealthyStatusWidgets(
        services?: EcsAggregationDashboardServiceConfig[]
    ): Widget[] {
        if (!services) return [];

        const albConfigs = services
            .map((service) => service.albConfig)
            .filter((albConfig) => albConfig) as AlbConfig[];

        if (!albConfigs.length) {
            return [];
        }

        const uptimeHistoryMetrics = albConfigs.reduce((acc, albConfig, index) => {
            const firstMetricId = `m${index * 2 + 1}`;
            const secondMetricId = `m${index * 2 + 2}`;
            const expressionId = `e${index + 1}`;

            const targetGroupName = albConfig.targetGroup.toString().split('/')[1];

            acc.push(
                new awsx.cloudwatch.Metric({
                    id: firstMetricId,
                    namespace: 'AWS/ApplicationELB',
                    name: 'RequestCount',
                    label: `RequestCount ${targetGroupName}`,
                    dimensions: {
                        LoadBalancer: albConfig.loadBalancer,
                        TargetGroup: albConfig.targetGroup,
                    },
                    statistic: 'SampleCount',
                    period: dinamicPeriod,
                    visible: false,
                })
            );

            acc.push(
                new awsx.cloudwatch.Metric({
                    id: secondMetricId,
                    namespace: 'AWS/ApplicationELB',
                    name: 'HTTPCode_Target_5XX_Count',
                    label: `HTTPCode_Target_5XX_Count ${targetGroupName}`,
                    dimensions: {
                        LoadBalancer: albConfig.loadBalancer,
                        TargetGroup: albConfig.targetGroup,
                    },
                    statistic: 'SampleCount',
                    period: dinamicPeriod,
                    visible: false,
                })
            );

            acc.push(
                new awsx.cloudwatch.ExpressionWidgetMetric(
                    `(1-(${secondMetricId}/${firstMetricId}))*100`,
                    targetGroupName,
                    expressionId
                )
            );

            return acc;
        }, [] as awsx.cloudwatch.WidgetMetric[]);

        const healthyHistoryMetrics = albConfigs.reduce((acc, albConfig, index) => {
            const firstMetricId = `m${index * 2 + 1}`;
            const secondMetricId = `m${index * 2 + 2}`;
            const expressionId = `e${index + 1}`;

            const targetGroupName = albConfig.targetGroup.toString().split('/')[1];

            acc.push(
                new awsx.cloudwatch.Metric({
                    id: firstMetricId,
                    namespace: 'AWS/ApplicationELB',
                    name: 'HealthyHostCount',
                    label: `HealthyHostCount ${targetGroupName}`,
                    dimensions: {
                        LoadBalancer: albConfig.loadBalancer,
                        TargetGroup: albConfig.targetGroup,
                    },
                    statistic: 'Maximum',
                    period: dinamicPeriod,
                    visible: false,
                })
            );

            acc.push(
                new awsx.cloudwatch.Metric({
                    id: secondMetricId,
                    namespace: 'AWS/ApplicationELB',
                    name: 'UnHealthyHostCount',
                    label: `UnHealthyHostCount ${targetGroupName}`,
                    dimensions: {
                        LoadBalancer: albConfig.loadBalancer,
                        TargetGroup: albConfig.targetGroup,
                    },
                    statistic: 'Maximum',
                    period: dinamicPeriod,
                    visible: false,
                })
            );

            acc.push(
                new awsx.cloudwatch.ExpressionWidgetMetric(
                    `(1-(${secondMetricId}/${firstMetricId}))*100`,
                    targetGroupName,
                    expressionId
                )
            );

            return acc;
        }, [] as awsx.cloudwatch.WidgetMetric[]);

        return [
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Uptime History',
                width: 12,
                height: 4,
                period: dinamicPeriod,
                metrics: uptimeHistoryMetrics,
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Healthy History',
                width: 12,
                height: 4,
                period: dinamicPeriod,
                metrics: healthyHistoryMetrics,
            }),
        ];
    }

    static createLatencyAndRequestCountWidgets(
        services?: EcsAggregationDashboardServiceConfig[]
    ): Widget[] {
        if (!services) return [];

        const albConfigs = services
            .map((service) => service.albConfig)
            .filter((albConfig) => albConfig) as AlbConfig[];

        if (!albConfigs.length) {
            return [];
        }

        const latencyWarning = 0.3;
        const latencyAlarm = 0.5;

        const targetResponseTimeMetrics = albConfigs.map((albConfig) => {
            const targetGroupName = albConfig.targetGroup.toString().split('/')[1];

            return new awsx.cloudwatch.Metric({
                namespace: 'AWS/ApplicationELB',
                name: 'TargetResponseTime',
                label: targetGroupName,
                dimensions: {
                    LoadBalancer: albConfig.loadBalancer,
                    TargetGroup: albConfig.targetGroup,
                },
                statistic: 'Average',
                period: dinamicPeriod,
            });
        });

        const requestCountMetrics = albConfigs.map((albConfig) => {
            const targetGroupName = albConfig.targetGroup.toString().split('/')[1];

            return new awsx.cloudwatch.Metric({
                namespace: 'AWS/ApplicationELB',
                name: 'RequestCount',
                label: targetGroupName,
                dimensions: {
                    LoadBalancer: albConfig.loadBalancer,
                    TargetGroup: albConfig.targetGroup,
                },
                statistic: 'Sum',
                period: dinamicPeriod,
            });
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
                metrics: targetResponseTimeMetrics,
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Request Count',
                width: 12,
                height: 6,
                metrics: requestCountMetrics,
            }),
        ];
    }

    static createServiceMemoryAndCpuUtizilationWidgets(
        services?: EcsAggregationDashboardServiceConfig[]
    ): Widget[] {
        if (!services) return [];

        const serviceConfigs = services.map((service) => service.serviceConfig);

        const memoryUtilizationMetrics = serviceConfigs.map(
            (serviceConfig) =>
                new awsx.cloudwatch.Metric({
                    namespace: 'AWS/ECS',
                    name: 'MemoryUtilization',
                    label: serviceConfig.serviceName,
                    dimensions: {
                        ClusterName: serviceConfig.clusterName,
                        ServiceName: serviceConfig.serviceName,
                    },
                    statistic: 'Average',
                    period: dinamicPeriod,
                })
        );

        const cpuUtilizationMetrics = serviceConfigs.map(
            (serviceConfig) =>
                new awsx.cloudwatch.Metric({
                    namespace: 'AWS/ECS',
                    name: 'CPUUtilization',
                    label: serviceConfig.serviceName,
                    dimensions: {
                        ClusterName: serviceConfig.clusterName,
                        ServiceName: serviceConfig.serviceName,
                    },
                    statistic: 'Average',
                    period: dinamicPeriod,
                })
        );

        return [
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Service Memory Utilization',
                width: 12,
                height: 6,
                metrics: memoryUtilizationMetrics,
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Service CPU Utilization',
                width: 12,
                height: 6,
                metrics: cpuUtilizationMetrics,
            }),
        ];
    }

    static createInstanceMemoryAndCpuUtizilationWidgets(
        services?: EcsAggregationDashboardServiceConfig[]
    ): Widget[] {
        if (!services) return [];

        const clusters = Array.from(
            services.reduce(
                (acc, service) => acc.add(service.serviceConfig.clusterName.toString()),
                new Set<string>()
            )
        );

        const memoryReservationMetrics = clusters.map(
            (clusterName) =>
                new awsx.cloudwatch.Metric({
                    namespace: 'AWS/ECS',
                    name: 'MemoryReservation',
                    label: clusterName,
                    dimensions: {
                        ClusterName: clusterName,
                    },
                    statistic: 'Average',
                    period: dinamicPeriod,
                })
        );

        const memoryUtilizationMetrics = clusters.map(
            (clusterName) =>
                new awsx.cloudwatch.Metric({
                    namespace: 'AWS/ECS',
                    name: 'MemoryUtilization',
                    label: clusterName,
                    dimensions: {
                        ClusterName: clusterName,
                    },
                    statistic: 'Average',
                    period: dinamicPeriod,
                })
        );

        const cpuUtilizationMetrics = clusters.map(
            (clusterName) =>
                new awsx.cloudwatch.Metric({
                    namespace: 'AWS/ECS',
                    name: 'CPUUtilization',
                    label: clusterName,
                    dimensions: {
                        ClusterName: clusterName,
                    },
                    statistic: 'Average',
                    period: dinamicPeriod,
                })
        );

        return [
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Instance Memory Reservation',
                width: 8,
                height: 6,
                metrics: memoryReservationMetrics,
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Instance Memory Utilization',
                width: 8,
                height: 6,
                metrics: memoryUtilizationMetrics,
            }),
            new awsx.cloudwatch.LineGraphMetricWidget({
                title: 'Instance CPU Utilization',
                width: 8,
                height: 6,
                metrics: cpuUtilizationMetrics,
            }),
        ];
    }
}
