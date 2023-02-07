import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import { Widget, EcsServiceConfig, WidgetExtraConfigs } from '../../../types';
import { ExpressionBuilder, MetricBuilder, MetricWidgetBuilder } from '../../builders';

export function memoryAndCpu(
    configs: EcsServiceConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const { clusterName, serviceName } = configs;

    const shortPeriod = extraConfigs?.shortPeriod || constants.DEFAULT_PERIOD;
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const namespaceEcsInsights = 'ECS/ContainerInsights';
    const namespaceEcsClassic = 'AWS/ECS';

    const memoryReservedMetric = new MetricBuilder({
        namespace: namespaceEcsInsights,
        metricName: 'MemoryReserved',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
    })
        .stat('Average')
        .label('MemoryReserved');

    const memoryUtilizedMetric = new MetricBuilder({
        namespace: namespaceEcsInsights,
        metricName: 'MemoryUtilized',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
    })
        .stat('Average')
        .label('MemoryUtilized');

    const memoryUtilizationMetric = new MetricBuilder({
        namespace: namespaceEcsClassic,
        metricName: 'MemoryUtilization',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
    })
        .stat('Average')
        .label('MemoryUtilization');

    const memoryAnomalyDetectionExpression = new ExpressionBuilder({
        expression: 'ANOMALY_DETECTION_BAND(m1, 2)',
    })
        .label('AnomalyDetectionBand')
        .id('e1');

    const cpuReservedMetric = new MetricBuilder({
        namespace: namespaceEcsInsights,
        metricName: 'CpuReserved',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
    })
        .stat('Average')
        .label('CpuReserved');

    const cpuUtilizedMetric = new MetricBuilder({
        namespace: namespaceEcsInsights,
        metricName: 'CpuUtilized',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
    })
        .stat('Average')
        .label('CpuUtilized');

    const cpuUtilizationMetric = new MetricBuilder({
        namespace: namespaceEcsClassic,
        metricName: 'CPUUtilization',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
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
            .title('Memory Status')
            .view('singleValue')
            .width(3)
            .height(6)
            .addMetric(memoryReservedMetric.period(shortPeriod).build())
            .addMetric(memoryUtilizedMetric.period(shortPeriod).build())
            .build(),
        new MetricWidgetBuilder()
            .title('Memory Utilization')
            .view('timeSeries')
            .width(9)
            .height(6)
            .addMetric(memoryUtilizationMetric.id('m1').period(longPeriod).build())
            .addMetric(memoryAnomalyDetectionExpression.build())
            .build(),
        new MetricWidgetBuilder()
            .title('CPU Status')
            .view('singleValue')
            .width(3)
            .height(6)
            .addMetric(cpuReservedMetric.period(shortPeriod).build())
            .addMetric(cpuUtilizedMetric.period(shortPeriod).build())
            .build(),
        new MetricWidgetBuilder()
            .title('CPU Utilization')
            .view('timeSeries')
            .width(9)
            .height(6)
            .addMetric(cpuUtilizationMetric.id('m1').period(longPeriod).build())
            .addMetric(cpuAnomalyDetectionExpression.build())
            .build(),
    ];
}
