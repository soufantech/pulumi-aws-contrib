/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';

import * as constants from '../../../constants';
import { EcsClusterWithAsgConfig, WidgetExtraConfigs } from '../../../types';

function createInstanceAndTaskCountWidgets(
    clusterName: string,
    asgName: string,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const shortPeriod = extraConfigs?.shortPeriod || constants.DEFAULT_PERIOD;
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const asgInServiceInstancesMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/AutoScaling',
        name: 'GroupInServiceInstances',
        label: 'GroupInServiceInstances',
        dimensions: { AutoScalingGroupName: asgName },
        statistic: 'Maximum',
    });

    const asgDesiredCapacityMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/AutoScaling',
        name: 'GroupInServiceInstances',
        label: 'GroupInServiceInstances',
        dimensions: { AutoScalingGroupName: asgName },
        statistic: 'Maximum',
    });

    const asgMaxSizeMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/AutoScaling',
        name: 'GroupMaxSize',
        label: 'GroupMaxSize',
        dimensions: { AutoScalingGroupName: asgName },
        statistic: 'Maximum',
    });

    const serviceCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'ServiceCount',
        label: 'ServiceCount',
        dimensions: { ClusterName: clusterName },
        statistic: 'Maximum',
    });

    const taskCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'TaskCount',
        label: 'TaskCount',
        dimensions: { ClusterName: clusterName },
        statistic: 'Maximum',
    });

    return [
        new awsx.cloudwatch.SingleNumberMetricWidget({
            title: 'Instance Count Status',
            width: 3,
            height: 6,
            metrics: [
                asgInServiceInstancesMetric.withPeriod(shortPeriod),
                asgMaxSizeMetric.withPeriod(shortPeriod),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: `Instance Count History (${asgName})`,
            width: 9,
            height: 6,
            metrics: [
                asgDesiredCapacityMetric.withPeriod(longPeriod),
                asgInServiceInstancesMetric.withPeriod(longPeriod),
            ],
        }),
        new awsx.cloudwatch.SingleNumberMetricWidget({
            title: 'Task Count Status',
            width: 3,
            height: 6,
            metrics: [
                serviceCountMetric.withPeriod(shortPeriod),
                taskCountMetric.withPeriod(shortPeriod),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: `Task Count History (${clusterName})`,
            width: 9,
            height: 6,
            metrics: [taskCountMetric.withPeriod(longPeriod)],
        }),
    ];
}

function createOnlyTaskCountWidgets(
    clusterName: string,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const shortPeriod = extraConfigs?.shortPeriod || constants.DEFAULT_PERIOD;
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const serviceCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'ServiceCount',
        label: 'ServiceCount',
        dimensions: { ClusterName: clusterName },
        statistic: 'Maximum',
    });

    const taskCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'TaskCount',
        label: 'TaskCount',
        dimensions: { ClusterName: clusterName },
        statistic: 'Maximum',
    });

    return [
        new awsx.cloudwatch.SingleNumberMetricWidget({
            title: 'Task Count Status',
            width: 6,
            height: 4,
            metrics: [
                serviceCountMetric.withPeriod(shortPeriod),
                taskCountMetric.withPeriod(shortPeriod),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: `Task Count History (${clusterName})`,
            width: 18,
            height: 4,
            metrics: [taskCountMetric.withPeriod(longPeriod)],
        }),
    ];
}

export default function createWidgets(
    configs: EcsClusterWithAsgConfig,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const { clusterName, asgName } = configs;

    if (asgName) {
        return createInstanceAndTaskCountWidgets(clusterName, asgName, extraConfigs);
    }

    return createOnlyTaskCountWidgets(clusterName, extraConfigs);
}
