import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import { Widget, EcsAggregationConfig, WidgetExtraConfigs } from '../../../types';
import { MetricBuilder, MetricWidgetBuilder } from '../../builders';

export function instanceMemoryAndCpu(
    configs: EcsAggregationConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<pulumi.Output<Widget>[]> {
    const { services } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;
    const height = constants.DEFAULT_HEIGHT;

    const clustersOutput = services.map((service) => service.serviceConfig.clusterName);

    return pulumi.all(clustersOutput).apply((clusters) => {
        const clusterNames = Array.from(
            clusters.reduce((acc, cluster) => acc.add(cluster), new Set<string>())
        );

        const memoryReservationMetrics = clusterNames.map((clusterName) =>
            new MetricBuilder({
                namespace: 'AWS/ECS',
                metricName: 'MemoryReservation',
                dimensions: { ClusterName: clusterName },
            })
                .stat('Average')
                .period(longPeriod)
                .label(clusterName)
        );

        const memoryUtilizationMetrics = clusterNames.map((clusterName) =>
            new MetricBuilder({
                namespace: 'AWS/ECS',
                metricName: 'MemoryUtilization',
                dimensions: { ClusterName: clusterName },
            })
                .stat('Average')
                .period(longPeriod)
                .label(clusterName)
        );

        const cpuUtilizationMetrics = clusterNames.map((clusterName) =>
            new MetricBuilder({
                namespace: 'AWS/ECS',
                metricName: 'CPUUtilization',
                dimensions: { ClusterName: clusterName },
            })
                .stat('Average')
                .period(longPeriod)
                .label(clusterName)
        );

        const memoryReservationWidget = new MetricWidgetBuilder()
            .title('Instance Memory Reservation')
            .view('timeSeries')
            .width(8)
            .height(height)
            .period(longPeriod);
        memoryReservationMetrics.forEach((metric) =>
            memoryReservationWidget.addMetric(metric.build())
        );

        const memoryUtilizationWidget = new MetricWidgetBuilder()
            .title('Instance Memory Utilization')
            .view('timeSeries')
            .width(8)
            .height(height)
            .period(longPeriod);
        memoryUtilizationMetrics.forEach((metric) =>
            memoryUtilizationWidget.addMetric(metric.build())
        );

        const cpuUtilizationWidget = new MetricWidgetBuilder()
            .title('Instance CPU Utilization')
            .view('timeSeries')
            .width(8)
            .height(height)
            .period(longPeriod);
        cpuUtilizationMetrics.forEach((metric) => cpuUtilizationWidget.addMetric(metric.build()));

        return [
            memoryReservationWidget.build(),
            memoryUtilizationWidget.build(),
            cpuUtilizationWidget.build(),
        ];
    });
}
