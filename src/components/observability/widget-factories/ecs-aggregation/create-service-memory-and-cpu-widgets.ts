/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';

import * as constants from '../../constants';
import { EcsServiceAggregationDashboardConfig } from '../../ecs-aggregation-dashboard';
import { WidgetExtraConfigs } from '../../types';

export default function createWidgets(
    configs: EcsServiceAggregationDashboardConfig,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const { services } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

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
                period: longPeriod,
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
                period: longPeriod,
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
