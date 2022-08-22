/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';

import * as constants from '../../../constants';
import { EcsServiceWithAsgConfig, WidgetExtraConfigs } from '../../../types';

function createInstanceAndTaskCountWidgets(
    clusterName: string,
    serviceName: string,
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
        name: 'GroupDesiredCapacity',
        label: 'GroupDesiredCapacity',
        dimensions: { AutoScalingGroupName: asgName },
        statistic: 'Maximum',
    });

    const desiredTaskCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'DesiredTaskCount',
        label: 'DesiredTaskCount',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
        statistic: 'Maximum',
    });

    const pendingTaskCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'PendingTaskCount',
        label: 'PendingTaskCount',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
        statistic: 'Maximum',
    });

    const runningTaskCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'RunningTaskCount',
        label: 'RunningTaskCount',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
        statistic: 'Maximum',
    });

    return [
        new awsx.cloudwatch.SingleNumberMetricWidget({
            title: 'Instance Count Status',
            width: 3,
            height: 6,
            metrics: [
                asgInServiceInstancesMetric.withPeriod(shortPeriod),
                runningTaskCountMetric.withPeriod(shortPeriod),
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
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: `Task Count History (${clusterName})`,
            width: 12,
            height: 6,
            metrics: [
                desiredTaskCountMetric.withPeriod(longPeriod),
                pendingTaskCountMetric.withPeriod(longPeriod),
                runningTaskCountMetric.withPeriod(longPeriod),
            ],
        }),
    ];
}

function createOnlyTaskCountWidgets(
    clusterName: string,
    serviceName: string,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const shortPeriod = extraConfigs?.shortPeriod || constants.DEFAULT_PERIOD;
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const desiredTaskCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'DesiredTaskCount',
        label: 'DesiredTaskCount',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
        statistic: 'Maximum',
    });

    const pendingTaskCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'PendingTaskCount',
        label: 'PendingTaskCount',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
        statistic: 'Maximum',
    });

    const runningTaskCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'RunningTaskCount',
        label: 'RunningTaskCount',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
        statistic: 'Maximum',
    });

    return [
        new awsx.cloudwatch.SingleNumberMetricWidget({
            title: 'Instance Count Stats',
            width: 3,
            height: 4,
            metrics: [runningTaskCountMetric.withPeriod(shortPeriod)],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: `Task Count History (${clusterName})`,
            width: 21,
            height: 4,
            metrics: [
                desiredTaskCountMetric.withPeriod(longPeriod),
                pendingTaskCountMetric.withPeriod(longPeriod),
                runningTaskCountMetric.withPeriod(longPeriod),
            ],
        }),
    ];
}

export default function createWidgets(
    configs: EcsServiceWithAsgConfig,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const { clusterName, serviceName, asgName } = configs;

    if (asgName) {
        return createInstanceAndTaskCountWidgets(clusterName, serviceName, asgName, extraConfigs);
    }

    return createOnlyTaskCountWidgets(clusterName, serviceName, extraConfigs);
}
