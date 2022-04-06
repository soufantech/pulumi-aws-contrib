/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';

import * as constants from '../../constants';
import { EcsServiceConfig } from '../../types';

export default function createWidgets(configs: EcsServiceConfig): Widget[] {
    const { clusterName, serviceName } = configs;

    const memoryUtilizationMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ECS',
        name: 'MemoryUtilization',
        label: 'MemoryUtilization',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
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
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
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
            period: constants.LONG_PERIOD,
            metrics: [
                memoryAnomalyDetectionExpression,
                memoryUtilizationMetric.withId('m1').withPeriod(constants.LONG_PERIOD),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'CPU Utilization',
            width: 12,
            height: 6,
            period: constants.LONG_PERIOD,
            metrics: [
                cpuAnomalyDetectionExpression,
                cpuUtilizationMetric.withId('m1').withPeriod(constants.LONG_PERIOD),
            ],
        }),
    ];
}
