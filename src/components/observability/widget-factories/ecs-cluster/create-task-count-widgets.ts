/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';

import * as constants from '../../constants';
import { EcsClusterWithAsgConfig } from '../../types';

function createInstanceAndTaskCountWidgets(clusterName: string, asgName: string): Widget[] {
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
                asgInServiceInstancesMetric.withPeriod(constants.SHORT_PERIOD),
                asgMaxSizeMetric.withPeriod(constants.SHORT_PERIOD),
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
        new awsx.cloudwatch.SingleNumberMetricWidget({
            title: 'Task Count Status',
            width: 3,
            height: 6,
            metrics: [
                serviceCountMetric.withPeriod(constants.SHORT_PERIOD),
                taskCountMetric.withPeriod(constants.SHORT_PERIOD),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: `Task Count History (${clusterName})`,
            width: 9,
            height: 6,
            metrics: [taskCountMetric.withPeriod(constants.LONG_PERIOD)],
        }),
    ];
}

function createOnlyTaskCountWidgets(clusterName: string): Widget[] {
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
                serviceCountMetric.withPeriod(constants.SHORT_PERIOD),
                taskCountMetric.withPeriod(constants.SHORT_PERIOD),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: `Task Count History (${clusterName})`,
            width: 18,
            height: 4,
            metrics: [taskCountMetric.withPeriod(constants.LONG_PERIOD)],
        }),
    ];
}

export default function createWidgets(configs: EcsClusterWithAsgConfig): Widget[] {
    const { clusterName, asgName } = configs;

    if (asgName) {
        return createInstanceAndTaskCountWidgets(clusterName, asgName);
    }

    return createOnlyTaskCountWidgets(clusterName);
}
