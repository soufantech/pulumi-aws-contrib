/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';

import * as constants from '../../constants';
import { EcsServiceConfig, WidgetExtraConfigs } from '../../types';

export default function createWidgets(
    configs: EcsServiceConfig,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const { clusterName, serviceName } = configs;

    const shortPeriod = extraConfigs?.shortPeriod || constants.DEFAULT_PERIOD;
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const memoryReservedMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'MemoryReserved',
        label: 'MemoryReserved',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
        statistic: 'Average',
    });

    const memoryUtilizedMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'MemoryUtilized',
        label: 'MemoryUtilized',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
        statistic: 'Average',
    });

    const memoryOverflowExpression = new awsx.cloudwatch.ExpressionWidgetMetric(
        'm2-m1',
        'MemoryOverflow',
        'e1'
    );

    const cpuReservedMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'CpuReserved',
        label: 'CpuReserved',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
        statistic: 'Average',
    });

    const cpuUtilizedMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'CpuUtilized',
        label: 'CpuUtilized',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
        statistic: 'Average',
    });

    const cpuOverflowExpression = new awsx.cloudwatch.ExpressionWidgetMetric(
        'm2-m1',
        'CpuOverflow',
        'e1'
    );

    return [
        new awsx.cloudwatch.SingleNumberMetricWidget({
            title: 'Memory Status',
            width: 3,
            height: 6,
            metrics: [
                memoryReservedMetric.withPeriod(shortPeriod),
                memoryUtilizedMetric.withPeriod(shortPeriod),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Memory Overflow',
            width: 9,
            height: 6,
            period: longPeriod,
            metrics: [
                memoryOverflowExpression,
                memoryReservedMetric.withId('m1').withPeriod(longPeriod).withVisible(false),
                memoryUtilizedMetric.withId('m2').withPeriod(longPeriod).withVisible(false),
            ],
        }),
        new awsx.cloudwatch.SingleNumberMetricWidget({
            title: 'CPU Status',
            width: 3,
            height: 6,
            metrics: [
                cpuReservedMetric.withPeriod(shortPeriod),
                cpuUtilizedMetric.withPeriod(shortPeriod),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'CPU Overflow',
            width: 9,
            height: 6,
            period: longPeriod,
            metrics: [
                cpuOverflowExpression,
                cpuReservedMetric.withId('m1').withPeriod(longPeriod).withVisible(false),
                cpuUtilizedMetric.withId('m2').withPeriod(longPeriod).withVisible(false),
            ],
        }),
    ];
}
