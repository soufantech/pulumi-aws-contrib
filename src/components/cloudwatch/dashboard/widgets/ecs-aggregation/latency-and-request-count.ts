/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx/classic';
import { Widget } from '@pulumi/awsx/classic/cloudwatch';

import * as constants from '../../../constants';
import { EcsAggregationConfig, TargetGroupConfig, WidgetExtraConfigs } from '../../../types';

export function latencyAndRequestCount(
    configs: EcsAggregationConfig,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const { services } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const albConfigs = services
        .map((service) => service.targetGroupConfig)
        .filter((targetGroupConfig) => targetGroupConfig) as TargetGroupConfig[];

    if (!albConfigs.length) {
        return [];
    }

    const targetResponseTimeMetrics = albConfigs.map((albConfig) => {
        const targetGroupName = albConfig.targetGroup.toString().split('/')[1];

        return new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'TargetResponseTime',
            label: targetGroupName,
            dimensions: {
                LoadBalancer: albConfig.loadBalancer,
                TargetGroup: albConfig.targetGroup,
            },
            statistic: 'Average',
            period: longPeriod,
        });
    });

    const requestCountMetrics = albConfigs.map((albConfig) => {
        const targetGroupName = albConfig.targetGroup.toString().split('/')[1];

        return new awsx.cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            name: 'RequestCount',
            label: targetGroupName,
            dimensions: {
                LoadBalancer: albConfig.loadBalancer,
                TargetGroup: albConfig.targetGroup,
            },
            statistic: 'Sum',
            period: longPeriod,
        });
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
            metrics: targetResponseTimeMetrics,
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Request Count',
            width: 12,
            height: 6,
            metrics: requestCountMetrics,
        }),
    ];
}
