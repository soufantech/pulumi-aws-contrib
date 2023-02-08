import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import { Widget, EcsClusterConfig, WidgetExtraConfigs } from '../../../types';
import { ExpressionBuilder, MetricBuilder, MetricWidgetBuilder } from '../../builders';

export function memoryAndCpu(
    configs: EcsClusterConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const { clusterName } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;
    const height = constants.DEFAULT_HEIGHT;

    const memoryUtilizationMetric = new MetricBuilder({
        namespace: 'AWS/ECS',
        metricName: 'MemoryUtilization',
        dimensions: { ClusterName: clusterName },
    })
        .stat('Average')
        .label('MemoryUtilization');

    const memoryAnomalyDetectionExpression = new ExpressionBuilder({
        expression: 'ANOMALY_DETECTION_BAND(m1, 2)',
    })
        .label('AnomalyDetectionBand')
        .id('e1');

    const cpuUtilizationMetric = new MetricBuilder({
        namespace: 'AWS/ECS',
        metricName: 'CPUUtilization',
        dimensions: { ClusterName: clusterName },
    })
        .stat('Average')
        .label('CPUUtilization');

    const cpuAnomalyDetectionExpression = new ExpressionBuilder({
        expression: 'ANOMALY_DETECTION_BAND(m1, 2)',
    })
        .label('AnomalyDetectionBand')
        .id('e1');

    return [
        new MetricWidgetBuilder()
            .title('Memory Utilization')
            .view('timeSeries')
            .width(12)
            .height(height)
            .period(longPeriod)
            .addMetric(memoryUtilizationMetric.id('m1').period(longPeriod).build())
            .addMetric(memoryAnomalyDetectionExpression.build())
            .build(),
        new MetricWidgetBuilder()
            .title('CPU Utilization')
            .view('timeSeries')
            .width(12)
            .height(height)
            .period(longPeriod)
            .addMetric(cpuUtilizationMetric.id('m1').period(longPeriod).build())
            .addMetric(cpuAnomalyDetectionExpression.build())
            .build(),
    ];
}
