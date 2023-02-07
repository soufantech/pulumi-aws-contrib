import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import { Widget, EcsServiceWithAsgConfig, WidgetExtraConfigs } from '../../../types';
import { MetricBuilder, MetricWidgetBuilder } from '../../builders';

function createContainerMetrics(
    clusterName: pulumi.Input<string>,
    serviceName: pulumi.Input<string>
): [MetricBuilder, MetricBuilder, MetricBuilder] {
    const namespaceEcsInsights = 'ECS/ContainerInsights';

    const desiredTaskCountMetric = new MetricBuilder({
        namespace: namespaceEcsInsights,
        metricName: 'DesiredTaskCount',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
    })
        .stat('Maximum')
        .label('DesiredTaskCount');

    const pendingTaskCountMetric = new MetricBuilder({
        namespace: namespaceEcsInsights,
        metricName: 'PendingTaskCount',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
    })
        .stat('Maximum')
        .label('PendingTaskCount');

    const runningTaskCountMetric = new MetricBuilder({
        namespace: namespaceEcsInsights,
        metricName: 'RunningTaskCount',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
    })
        .stat('Maximum')
        .label('RunningTaskCount');

    return [desiredTaskCountMetric, pendingTaskCountMetric, runningTaskCountMetric];
}

function instanceAndTaskCount(
    clusterName: pulumi.Input<string>,
    serviceName: pulumi.Input<string>,
    asgName: pulumi.Input<string>,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const shortPeriod = extraConfigs?.shortPeriod || constants.DEFAULT_PERIOD;
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const namespaceAutoScaling = 'AWS/AutoScaling';

    const asgInServiceInstancesMetric = new MetricBuilder({
        namespace: namespaceAutoScaling,
        metricName: 'GroupInServiceInstances',
        dimensions: { AutoScalingGroupName: asgName },
    })
        .stat('Maximum')
        .label('GroupInServiceInstances');

    const asgDesiredCapacityMetric = new MetricBuilder({
        namespace: namespaceAutoScaling,
        metricName: 'GroupDesiredCapacity',
        dimensions: { AutoScalingGroupName: asgName },
    })
        .stat('Maximum')
        .label('GroupDesiredCapacity');

    const [desiredTaskCountMetric, pendingTaskCountMetric, runningTaskCountMetric] =
        createContainerMetrics(clusterName, serviceName);

    return [
        new MetricWidgetBuilder()
            .title('Instance Count Status')
            .view('singleValue')
            .width(3)
            .height(6)
            .addMetric(asgInServiceInstancesMetric.period(shortPeriod).build())
            .addMetric(runningTaskCountMetric.period(shortPeriod).build())
            .build(),
        new MetricWidgetBuilder()
            .title(pulumi.interpolate`Instance Count History (${asgName})`)
            .view('timeSeries')
            .width(9)
            .height(6)
            .addMetric(asgDesiredCapacityMetric.period(longPeriod).build())
            .addMetric(asgInServiceInstancesMetric.period(longPeriod).build())
            .build(),
        new MetricWidgetBuilder()
            .title(pulumi.interpolate`Task Count History (${clusterName})`)
            .view('timeSeries')
            .width(12)
            .height(6)
            .addMetric(desiredTaskCountMetric.period(longPeriod).build())
            .addMetric(pendingTaskCountMetric.period(longPeriod).build())
            .addMetric(runningTaskCountMetric.period(longPeriod).build())
            .build(),
    ];
}

function onlyTaskCount(
    clusterName: pulumi.Input<string>,
    serviceName: pulumi.Input<string>,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const shortPeriod = extraConfigs?.shortPeriod || constants.DEFAULT_PERIOD;
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const [desiredTaskCountMetric, pendingTaskCountMetric, runningTaskCountMetric] =
        createContainerMetrics(clusterName, serviceName);

    return [
        new MetricWidgetBuilder()
            .title('Task Count Status')
            .view('singleValue')
            .width(3)
            .height(5)
            .addMetric(runningTaskCountMetric.period(shortPeriod).build())
            .build(),
        new MetricWidgetBuilder()
            .title(pulumi.interpolate`Task Count History (${clusterName})`)
            .view('timeSeries')
            .width(21)
            .height(5)
            .addMetric(desiredTaskCountMetric.period(longPeriod).build())
            .addMetric(pendingTaskCountMetric.period(longPeriod).build())
            .addMetric(runningTaskCountMetric.period(longPeriod).build())
            .build(),
    ];
}

export function taskCount(
    configs: EcsServiceWithAsgConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const { clusterName, serviceName, asgName } = configs;

    if (asgName) {
        return instanceAndTaskCount(clusterName, serviceName, asgName, extraConfigs);
    }

    return onlyTaskCount(clusterName, serviceName, extraConfigs);
}
