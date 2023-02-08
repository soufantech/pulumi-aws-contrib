import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import { Widget, EcsClusterWithAsgConfig, WidgetExtraConfigs } from '../../../types';
import { MetricBuilder, MetricWidgetBuilder } from '../../builders';

function createContainerMetrics(clusterName: pulumi.Input<string>): [MetricBuilder, MetricBuilder] {
    const serviceCountMetric = new MetricBuilder({
        namespace: 'ECS/ContainerInsights',
        metricName: 'ServiceCount',
        dimensions: { ClusterName: clusterName },
    })
        .stat('Maximum')
        .label('ServiceCount');

    const taskCountMetric = new MetricBuilder({
        namespace: 'ECS/ContainerInsights',
        metricName: 'TaskCount',
        dimensions: { ClusterName: clusterName },
    })
        .stat('Maximum')
        .label('TaskCount');

    return [serviceCountMetric, taskCountMetric];
}

function instanceAndTaskCount(
    clusterName: pulumi.Input<string>,
    asgName: pulumi.Input<string>,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const shortPeriod = extraConfigs?.shortPeriod || constants.DEFAULT_PERIOD;
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const asgInServiceInstancesMetric = new MetricBuilder({
        namespace: 'AWS/AutoScaling',
        metricName: 'GroupInServiceInstances',
        dimensions: { AutoScalingGroupName: asgName },
    })
        .stat('Maximum')
        .label('GroupInServiceInstances');

    const asgDesiredCapacityMetric = new MetricBuilder({
        namespace: 'AWS/AutoScaling',
        metricName: 'GroupDesiredCapacity',
        dimensions: { AutoScalingGroupName: asgName },
    })
        .stat('Maximum')
        .label('GroupDesiredCapacity');

    const asgMaxSizeMetric = new MetricBuilder({
        namespace: 'AWS/AutoScaling',
        metricName: 'GroupMaxSize',
        dimensions: { AutoScalingGroupName: asgName },
    })
        .stat('Maximum')
        .label('GroupMaxSize');

    const [serviceCountMetric, taskCountMetric] = createContainerMetrics(clusterName);

    return [
        new MetricWidgetBuilder()
            .title('Instance Count Status')
            .view('singleValue')
            .width(3)
            .height(6)
            .period(shortPeriod)
            .addMetric(asgInServiceInstancesMetric.period(shortPeriod).build())
            .addMetric(asgMaxSizeMetric.period(shortPeriod).build())
            .build(),
        new MetricWidgetBuilder()
            .title(pulumi.interpolate`Instance Count History (${asgName})`)
            .view('timeSeries')
            .width(9)
            .height(6)
            .period(longPeriod)
            .addMetric(asgDesiredCapacityMetric.period(longPeriod).build())
            .addMetric(asgInServiceInstancesMetric.period(longPeriod).build())
            .build(),
        new MetricWidgetBuilder()
            .title('Task Count Status')
            .view('singleValue')
            .width(3)
            .height(6)
            .period(shortPeriod)
            .addMetric(serviceCountMetric.period(shortPeriod).build())
            .addMetric(taskCountMetric.period(shortPeriod).build())
            .build(),
        new MetricWidgetBuilder()
            .title(pulumi.interpolate`Task Count History (${clusterName})`)
            .view('timeSeries')
            .width(9)
            .height(6)
            .period(longPeriod)
            .addMetric(taskCountMetric.period(longPeriod).build())
            .build(),
    ];
}

function onlyTaskCount(
    clusterName: pulumi.Input<string>,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const shortPeriod = extraConfigs?.shortPeriod || constants.DEFAULT_PERIOD;
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const [serviceCountMetric, taskCountMetric] = createContainerMetrics(clusterName);

    return [
        new MetricWidgetBuilder()
            .title('Task Count Status')
            .view('singleValue')
            .width(3)
            .height(6)
            .period(shortPeriod)
            .addMetric(serviceCountMetric.period(shortPeriod).build())
            .addMetric(taskCountMetric.period(shortPeriod).build())
            .build(),
        new MetricWidgetBuilder()
            .title(pulumi.interpolate`Task Count History (${clusterName})`)
            .view('timeSeries')
            .width(21)
            .height(6)
            .period(longPeriod)
            .addMetric(taskCountMetric.period(longPeriod).build())
            .build(),
    ];
}

export function taskCount(
    configs: EcsClusterWithAsgConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const { clusterName, asgName } = configs;

    if (asgName) {
        return instanceAndTaskCount(clusterName, asgName, extraConfigs);
    }

    return onlyTaskCount(clusterName, extraConfigs);
}
