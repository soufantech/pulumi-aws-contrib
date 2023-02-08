import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import { Widget, TargetGroupConfig, WidgetExtraConfigs } from '../../../types';
import { HorizontalAnnotationBuilder, MetricBuilder, MetricWidgetBuilder } from '../../builders';

export function latencyAndRequestCount(
    configs: TargetGroupConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const { loadBalancer, targetGroup } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;
    const height = constants.DEFAULT_HEIGHT;

    const namespace = 'AWS/ApplicationELB';

    const targetResponseTimeMetric = new MetricBuilder({
        namespace,
        metricName: 'TargetResponseTime',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
    });

    const requestCountMetric = new MetricBuilder({
        namespace,
        metricName: 'RequestCount',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
    })
        .stat('Sum')
        .label('RequestCount');

    const httpCodeTarget5xxCountMetric = new MetricBuilder({
        namespace,
        metricName: 'HTTPCode_Target_5XX_Count',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
    })
        .stat('Sum')
        .label('HTTPCode_Target_5XX_Count');

    const httpCodeTarget4xxCountMetric = new MetricBuilder({
        namespace,
        metricName: 'HTTPCode_Target_4XX_Count',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
    })
        .stat('Sum')
        .label('HTTPCode_Target_4XX_Count');

    const httpCodeTarget3xxCountMetric = new MetricBuilder({
        namespace,
        metricName: 'HTTPCode_Target_3XX_Count',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
    })
        .stat('Sum')
        .label('HTTPCode_Target_3XX_Count');

    const httpCodeTarget2xxCountMetric = new MetricBuilder({
        namespace,
        metricName: 'HTTPCode_Target_2XX_Count',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
    })
        .stat('Sum')
        .label('HTTPCode_Target_2XX_Count');

    const latencyWarning = 0.3;
    const latencyAlarm = 0.5;

    const warningColor = '#ff7f0e';
    const alarmColor = '#d62728';

    const warningAnnotation = new HorizontalAnnotationBuilder({ value: latencyWarning })
        .color(warningColor)
        .label('In warning')
        .build();
    const alarmAnnotation = new HorizontalAnnotationBuilder({ value: latencyAlarm })
        .color(alarmColor)
        .label('In alarm')
        .build();

    return [
        new MetricWidgetBuilder()
            .title('Target Group Latency')
            .view('timeSeries')
            .width(12)
            .height(height)
            .addHorizontalAnnotation(warningAnnotation)
            .addHorizontalAnnotation(alarmAnnotation)
            .addMetric(
                targetResponseTimeMetric
                    .period(longPeriod)
                    .stat('Minimum')
                    .label('TargetResponseTime Minimum')
                    .build()
            )
            .addMetric(
                targetResponseTimeMetric
                    .period(longPeriod)
                    .stat('Average')
                    .label('TargetResponseTime Average')
                    .build()
            )
            .addMetric(
                targetResponseTimeMetric
                    .period(longPeriod)
                    .stat('Maximum')
                    .label('TargetResponseTime Maximum')
                    .build()
            )
            .addMetric(
                targetResponseTimeMetric
                    .period(longPeriod)
                    .stat('p50')
                    .label('TargetResponseTime p50')
                    .build()
            )
            .addMetric(
                targetResponseTimeMetric
                    .period(longPeriod)
                    .stat('p90')
                    .label('TargetResponseTime p90')
                    .build()
            )
            .addMetric(
                targetResponseTimeMetric
                    .period(longPeriod)
                    .stat('p99')
                    .label('TargetResponseTime p99')
                    .build()
            )
            .build(),
        new MetricWidgetBuilder()
            .title('Request Count')
            .view('timeSeries')
            .width(12)
            .height(height)
            .stacked(true)
            .addMetric(requestCountMetric.period(longPeriod).yAxis('right').build())
            .addMetric(httpCodeTarget5xxCountMetric.period(longPeriod).build())
            .addMetric(httpCodeTarget4xxCountMetric.period(longPeriod).build())
            .addMetric(httpCodeTarget3xxCountMetric.period(longPeriod).build())
            .addMetric(httpCodeTarget2xxCountMetric.period(longPeriod).build())
            .build(),
    ];
}
