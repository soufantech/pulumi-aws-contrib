/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';

import * as constants from '../../constants';
import {
    EcsAggregationDashboardInstanceConfig,
    EcsAggregationDashboardServiceConfig,
    EcsServiceAggregationDashboardConfig,
} from '../../ecs-aggregation-dashboard';
import { WidgetExtraConfigs } from '../../types';

function createInstanceAndTaskCountWidgets(
    services: EcsAggregationDashboardServiceConfig[],
    instances: EcsAggregationDashboardInstanceConfig[],
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const asgInServiceInstancesMetrics = instances.map(
        (instance) =>
            new awsx.cloudwatch.Metric({
                namespace: 'AWS/AutoScaling',
                name: 'GroupInServiceInstances',
                label: instance.asgConfig.asgName,
                dimensions: { AutoScalingGroupName: instance.asgConfig.asgName },
                statistic: 'Maximum',
                period: longPeriod,
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
                period: longPeriod,
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

function createOnlyTaskCountWidgets(
    services: EcsAggregationDashboardServiceConfig[],
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

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
                period: longPeriod,
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

export default function createWidgets(
    configs: EcsServiceAggregationDashboardConfig,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const { services, instances } = configs;

    if (instances?.length) {
        return createInstanceAndTaskCountWidgets(services, instances, extraConfigs);
    }

    return createOnlyTaskCountWidgets(services, extraConfigs);
}
