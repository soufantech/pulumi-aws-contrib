import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import {
    Widget,
    EcsAggregationConfig,
    EcsAggregationInstanceConfig,
    EcsAggregationServiceConfig,
    WidgetExtraConfigs,
} from '../../../types';
import { MetricBuilder, MetricWidgetBuilder } from '../../builders';

function createContainerMetrics(
    services: EcsAggregationServiceConfig[],
    period: pulumi.Input<number>
): MetricBuilder[] {
    return services.map((service) =>
        new MetricBuilder({
            namespace: 'ECS/ContainerInsights',
            metricName: 'RunningTaskCount',
            dimensions: {
                ClusterName: service.serviceConfig.clusterName,
                ServiceName: service.serviceConfig.serviceName,
            },
        })
            .stat('Maximum')
            .period(period)
            .label(service.serviceConfig.serviceName)
    );
}

function instanceAndTaskCount(
    services: EcsAggregationServiceConfig[],
    instances: EcsAggregationInstanceConfig[],
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;
    const height = constants.DEFAULT_HEIGHT;

    const asgInServiceInstancesMetrics = instances.map((instance) =>
        new MetricBuilder({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupInServiceInstances',
            dimensions: { AutoScalingGroupName: instance.asgConfig.asgName },
        })
            .stat('Maximum')
            .period(longPeriod)
            .label(instance.asgConfig.asgName)
    );

    const runningTaskCountMetrics = createContainerMetrics(services, longPeriod);

    const asgInServiceInstancesWidget = new MetricWidgetBuilder()
        .title('Instance Count History')
        .view('timeSeries')
        .width(12)
        .height(height)
        .period(longPeriod);
    asgInServiceInstancesMetrics.forEach((metric) =>
        asgInServiceInstancesWidget.addMetric(metric.build())
    );

    const runningTaskCountWidget = new MetricWidgetBuilder()
        .title('Task Count History')
        .view('timeSeries')
        .width(12)
        .height(height)
        .period(longPeriod);
    runningTaskCountMetrics.forEach((metric) => runningTaskCountWidget.addMetric(metric.build()));

    return [asgInServiceInstancesWidget.build(), runningTaskCountWidget.build()];
}

function onlyTaskCount(
    services: EcsAggregationServiceConfig[],
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;
    const height = constants.DEFAULT_HEIGHT;

    const runningTaskCountMetrics = createContainerMetrics(services, longPeriod);

    const runningTaskCountWidget = new MetricWidgetBuilder()
        .title('Task Count History')
        .view('timeSeries')
        .width(24)
        .height(height)
        .period(longPeriod);
    runningTaskCountMetrics.forEach((metric) => runningTaskCountWidget.addMetric(metric.build()));

    return [runningTaskCountWidget.build()];
}

export function taskCount(
    configs: EcsAggregationConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const { services, instances } = configs;

    if (instances?.length) {
        return instanceAndTaskCount(services, instances, extraConfigs);
    }

    return onlyTaskCount(services, extraConfigs);
}
