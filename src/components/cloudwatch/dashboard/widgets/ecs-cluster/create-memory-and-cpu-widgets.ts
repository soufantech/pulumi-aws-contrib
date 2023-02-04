import * as awsx from '@pulumi/awsx/classic';
import { Widget } from '@pulumi/awsx/classic/cloudwatch';

import * as constants from '../../../constants';
import { EcsClusterConfig, WidgetExtraConfigs } from '../../../types';

export function createMemoryAndCpuWidgets(
    configs: EcsClusterConfig,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const { clusterName } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const memoryUtilizationMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ECS',
        name: 'MemoryUtilization',
        label: 'MemoryUtilization',
        dimensions: { ClusterName: clusterName },
        statistic: 'Average',
    });

    const memoryAnomalyDetectionExpression = new awsx.cloudwatch.ExpressionWidgetMetric(
        'ANOMALY_DETECTION_BAND(m1, 2)',
        'AnomalyDetectionBand',
        'e1'
    );

    const cpuUtilizationMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ECS',
        name: 'CPUUtilization',
        label: 'CPUUtilization',
        dimensions: { ClusterName: clusterName },
        statistic: 'Average',
    });

    const cpuAnomalyDetectionExpression = new awsx.cloudwatch.ExpressionWidgetMetric(
        'ANOMALY_DETECTION_BAND(m1, 2)',
        'AnomalyDetectionBand',
        'e1'
    );

    return [
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Memory Utilization',
            width: 12,
            height: 6,
            period: longPeriod,
            metrics: [
                memoryAnomalyDetectionExpression,
                memoryUtilizationMetric.withId('m1').withPeriod(longPeriod),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'CPU Utilization',
            width: 12,
            height: 6,
            period: longPeriod,
            metrics: [
                cpuAnomalyDetectionExpression,
                cpuUtilizationMetric.withId('m1').withPeriod(longPeriod),
            ],
        }),
    ];
}
