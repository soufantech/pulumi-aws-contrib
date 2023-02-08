import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import { Widget, EcsAggregationConfig, WidgetExtraConfigs } from '../../../types';
import { MetricBuilder, MetricWidgetBuilder } from '../../builders';

export function serviceMemoryAndCpu(
    configs: EcsAggregationConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const { services } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;
    const height = constants.DEFAULT_HEIGHT;

    const serviceConfigs = services.map((service) => service.serviceConfig);

    const memoryUtilizationMetrics = serviceConfigs.map((serviceConfig) =>
        new MetricBuilder({
            namespace: 'AWS/ECS',
            metricName: 'MemoryUtilization',
            dimensions: {
                ClusterName: serviceConfig.clusterName,
                ServiceName: serviceConfig.serviceName,
            },
        })
            .stat('Average')
            .period(longPeriod)
            .label(serviceConfig.serviceName)
    );

    const cpuUtilizationMetrics = serviceConfigs.map((serviceConfig) =>
        new MetricBuilder({
            namespace: 'AWS/ECS',
            metricName: 'CPUUtilization',
            dimensions: {
                ClusterName: serviceConfig.clusterName,
                ServiceName: serviceConfig.serviceName,
            },
        })
            .stat('Average')
            .period(longPeriod)
            .label(serviceConfig.serviceName)
    );

    const memoryUtilizationWidget = new MetricWidgetBuilder()
        .title('Service Memory Utilization')
        .view('timeSeries')
        .width(12)
        .height(height)
        .period(longPeriod);
    memoryUtilizationMetrics.forEach((metric) => memoryUtilizationWidget.addMetric(metric.build()));

    const cpuUtilizationWidget = new MetricWidgetBuilder()
        .title('Service CPU Utilization')
        .view('timeSeries')
        .width(12)
        .height(height)
        .period(longPeriod);
    cpuUtilizationMetrics.forEach((metric) => cpuUtilizationWidget.addMetric(metric.build()));

    return [memoryUtilizationWidget.build(), cpuUtilizationWidget.build()];
}
