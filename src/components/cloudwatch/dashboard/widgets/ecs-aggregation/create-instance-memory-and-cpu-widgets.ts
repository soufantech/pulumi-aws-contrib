/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx/classic';
import { Widget } from '@pulumi/awsx/classic/cloudwatch';

import * as constants from '../../../constants';
import { EcsAggregationConfig, WidgetExtraConfigs } from '../../../types';

export function createInstanceMemoryAndCpuWidgets(
    configs: EcsAggregationConfig,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const { services } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

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
                period: longPeriod,
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
                period: longPeriod,
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
                period: longPeriod,
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
