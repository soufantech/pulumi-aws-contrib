import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import {
    Widget,
    EcsAggregationConfig,
    TargetGroupConfig,
    WidgetExtraConfigs,
} from '../../../types';
import { MetricBuilder, MetricWidgetBuilder, HorizontalAnnotationBuilder } from '../../builders';

export function latencyAndRequestCount(
    configs: EcsAggregationConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<pulumi.Output<Widget>[]> {
    const { services } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;
    const height = constants.DEFAULT_HEIGHT;

    const albConfigsOutput = services
        .map((service) => service.targetGroupConfig)
        .filter((targetGroupConfig) => targetGroupConfig) as TargetGroupConfig[];

    if (!albConfigsOutput.length) {
        return pulumi.output([]);
    }

    return pulumi.all(albConfigsOutput).apply((albConfigs) => {
        const targetResponseTimeMetrics = albConfigs.map((albConfig) => {
            const targetGroupName = albConfig.targetGroup.split('/')[1];

            return new MetricBuilder({
                namespace: 'AWS/ApplicationELB',
                metricName: 'TargetResponseTime',
                dimensions: {
                    LoadBalancer: albConfig.loadBalancer,
                    TargetGroup: albConfig.targetGroup,
                },
            })
                .stat('Average')
                .period(longPeriod)
                .label(targetGroupName);
        });

        const requestCountMetrics = albConfigs.map((albConfig) => {
            const targetGroupName = albConfig.targetGroup.split('/')[1];

            return new MetricBuilder({
                namespace: 'AWS/ApplicationELB',
                metricName: 'RequestCount',
                dimensions: {
                    LoadBalancer: albConfig.loadBalancer,
                    TargetGroup: albConfig.targetGroup,
                },
            })
                .stat('Sum')
                .period(longPeriod)
                .label(targetGroupName);
        });

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

        const targetResponseTimeWidget = new MetricWidgetBuilder()
            .title('Target Group Latency')
            .view('timeSeries')
            .width(12)
            .height(height)
            .period(longPeriod)
            .addHorizontalAnnotation(warningAnnotation)
            .addHorizontalAnnotation(alarmAnnotation);
        targetResponseTimeMetrics.forEach((metric) => {
            targetResponseTimeWidget.addMetric(metric.build());
        });

        const requestCountWidget = new MetricWidgetBuilder()
            .title('Request Count')
            .view('timeSeries')
            .width(12)
            .height(height)
            .period(longPeriod);
        requestCountMetrics.forEach((metric) => {
            requestCountWidget.addMetric(metric.build());
        });

        return [targetResponseTimeWidget.build(), requestCountWidget.build()];
    });
}
