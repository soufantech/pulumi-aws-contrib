/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';

import * as constants from '../../constants';
import { TargetGroupConfig } from '../../types';

export default function createWidgets(configs: TargetGroupConfig): Widget[] {
    const { loadBalancer, targetGroup } = configs;

    const targetResponseTimeMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        name: 'TargetResponseTime',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
    });

    const requestCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        name: 'RequestCount',
        label: 'RequestCount',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
        statistic: 'Sum',
    });

    const httpCodeTarget5xxCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        name: 'HTTPCode_Target_5XX_Count',
        label: 'HTTPCode_Target_5XX_Count',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
        statistic: 'Sum',
    });

    const httpCodeTarget4xxCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        name: 'HTTPCode_Target_4XX_Count',
        label: 'HTTPCode_Target_4XX_Count',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
        statistic: 'Sum',
    });

    const httpCodeTarget3xxCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        name: 'HTTPCode_Target_3XX_Count',
        label: 'HTTPCode_Target_3XX_Count',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
        statistic: 'Sum',
    });

    const httpCodeTarget2xxCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        name: 'HTTPCode_Target_2XX_Count',
        label: 'HTTPCode_Target_2XX_Count',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
        statistic: 'Sum',
    });

    const latencyWarning = 0.3;
    const latencyAlarm = 0.5;

    const warningColor = '#ff7f0e';
    const alarmColor = '#d62728';

    const annotations = [
        new awsx.cloudwatch.HorizontalAnnotation({
            aboveEdge: { label: 'In warning', value: latencyWarning },
            color: warningColor,
        }),
        new awsx.cloudwatch.HorizontalAnnotation({
            aboveEdge: { label: 'In alarm', value: latencyAlarm },
            color: alarmColor,
        }),
    ];

    return [
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Target Group Latency',
            width: 12,
            height: 6,
            annotations,
            metrics: [
                targetResponseTimeMetric
                    .withPeriod(constants.LONG_PERIOD)
                    .withStatistic('Minimum')
                    .withLabel('TargetResponseTime Minimum'),
                targetResponseTimeMetric
                    .withPeriod(constants.LONG_PERIOD)
                    .withStatistic('Average')
                    .withLabel('TargetResponseTime Average'),
                targetResponseTimeMetric
                    .withPeriod(constants.LONG_PERIOD)
                    .withStatistic('Maximum')
                    .withLabel('TargetResponseTime Maximum'),
                targetResponseTimeMetric
                    .withPeriod(constants.LONG_PERIOD)
                    .withExtendedStatistic(50)
                    .withLabel('TargetResponseTime p50'),
                targetResponseTimeMetric
                    .withPeriod(constants.LONG_PERIOD)
                    .withExtendedStatistic(90)
                    .withLabel('TargetResponseTime p90'),
                targetResponseTimeMetric
                    .withPeriod(constants.LONG_PERIOD)
                    .withExtendedStatistic(99)
                    .withLabel('TargetResponseTime p99'),
            ],
        }),
        new awsx.cloudwatch.StackedAreaGraphMetricWidget({
            title: 'Request Count',
            width: 12,
            height: 6,
            metrics: [
                requestCountMetric.withPeriod(constants.LONG_PERIOD).withYAxis('right'),
                httpCodeTarget5xxCountMetric.withPeriod(constants.LONG_PERIOD),
                httpCodeTarget4xxCountMetric.withPeriod(constants.LONG_PERIOD),
                httpCodeTarget3xxCountMetric.withPeriod(constants.LONG_PERIOD),
                httpCodeTarget2xxCountMetric.withPeriod(constants.LONG_PERIOD),
            ],
        }),
    ];
}
