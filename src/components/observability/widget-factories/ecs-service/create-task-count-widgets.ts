/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';

import * as constants from '../../constants';
import { EcsServiceWithAsgConfig } from '../../types';

function createInstanceAndTaskCountWidgets(
    clusterName: string,
    serviceName: string,
    asgName: string
): Widget[] {
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
                asgInServiceInstancesMetric.withPeriod(constants.SHORT_PERIOD),
                runningTaskCountMetric.withPeriod(constants.SHORT_PERIOD),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: `Instance Count History (${asgName})`,
            width: 9,
            height: 6,
            metrics: [
                asgDesiredCapacityMetric.withPeriod(constants.LONG_PERIOD),
                asgInServiceInstancesMetric.withPeriod(constants.LONG_PERIOD),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: `Task Count History (${clusterName})`,
            width: 12,
            height: 6,
            metrics: [
                desiredTaskCountMetric.withPeriod(constants.LONG_PERIOD),
                pendingTaskCountMetric.withPeriod(constants.LONG_PERIOD),
                runningTaskCountMetric.withPeriod(constants.LONG_PERIOD),
            ],
        }),
    ];
}

function createOnlyTaskCountWidgets(clusterName: string, serviceName: string): Widget[] {
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
            metrics: [runningTaskCountMetric.withPeriod(constants.SHORT_PERIOD)],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: `Task Count History (${clusterName})`,
            width: 21,
            height: 4,
            metrics: [
                desiredTaskCountMetric.withPeriod(constants.LONG_PERIOD),
                pendingTaskCountMetric.withPeriod(constants.LONG_PERIOD),
                runningTaskCountMetric.withPeriod(constants.LONG_PERIOD),
            ],
        }),
    ];
}

export default function createWidgets(configs: EcsServiceWithAsgConfig): Widget[] {
    const { clusterName, serviceName, asgName } = configs;

    if (asgName) {
        return createInstanceAndTaskCountWidgets(clusterName, serviceName, asgName);
    }

    return createOnlyTaskCountWidgets(clusterName, serviceName);
}
