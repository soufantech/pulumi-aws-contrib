/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx/classic';
import { Widget } from '@pulumi/awsx/classic/cloudwatch';

import * as constants from '../../../constants';
import { EcsAggregationConfig, TargetGroupConfig, WidgetExtraConfigs } from '../../../types';

export default function createWidgets(
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

    const uptimeHistoryMetrics = albConfigs.reduce((acc, albConfig, index) => {
        const firstMetricId = `m${index * 2 + 1}`;
        const secondMetricId = `m${index * 2 + 2}`;
        const expressionId = `e${index + 1}`;

        const targetGroupName = albConfig.targetGroup.toString().split('/')[1];

        acc.push(
            new awsx.cloudwatch.Metric({
                id: firstMetricId,
                namespace: 'AWS/ApplicationELB',
                name: 'RequestCount',
                label: `RequestCount ${targetGroupName}`,
                dimensions: {
                    LoadBalancer: albConfig.loadBalancer,
                    TargetGroup: albConfig.targetGroup,
                },
                statistic: 'SampleCount',
                period: longPeriod,
                visible: false,
            })
        );

        acc.push(
            new awsx.cloudwatch.Metric({
                id: secondMetricId,
                namespace: 'AWS/ApplicationELB',
                name: 'HTTPCode_Target_5XX_Count',
                label: `HTTPCode_Target_5XX_Count ${targetGroupName}`,
                dimensions: {
                    LoadBalancer: albConfig.loadBalancer,
                    TargetGroup: albConfig.targetGroup,
                },
                statistic: 'SampleCount',
                period: longPeriod,
                visible: false,
            })
        );

        acc.push(
            new awsx.cloudwatch.ExpressionWidgetMetric(
                `(1-(${secondMetricId}/${firstMetricId}))*100`,
                targetGroupName,
                expressionId
            )
        );

        return acc;
    }, [] as awsx.cloudwatch.WidgetMetric[]);

    const healthyHistoryMetrics = albConfigs.reduce((acc, albConfig, index) => {
        const firstMetricId = `m${index * 2 + 1}`;
        const secondMetricId = `m${index * 2 + 2}`;
        const expressionId = `e${index + 1}`;

        const targetGroupName = albConfig.targetGroup.toString().split('/')[1];

        acc.push(
            new awsx.cloudwatch.Metric({
                id: firstMetricId,
                namespace: 'AWS/ApplicationELB',
                name: 'HealthyHostCount',
                label: `HealthyHostCount ${targetGroupName}`,
                dimensions: {
                    LoadBalancer: albConfig.loadBalancer,
                    TargetGroup: albConfig.targetGroup,
                },
                statistic: 'Maximum',
                period: longPeriod,
                visible: false,
            })
        );

        acc.push(
            new awsx.cloudwatch.Metric({
                id: secondMetricId,
                namespace: 'AWS/ApplicationELB',
                name: 'UnHealthyHostCount',
                label: `UnHealthyHostCount ${targetGroupName}`,
                dimensions: {
                    LoadBalancer: albConfig.loadBalancer,
                    TargetGroup: albConfig.targetGroup,
                },
                statistic: 'Maximum',
                period: longPeriod,
                visible: false,
            })
        );

        acc.push(
            new awsx.cloudwatch.ExpressionWidgetMetric(
                `(1-(${secondMetricId}/${firstMetricId}))*100`,
                targetGroupName,
                expressionId
            )
        );

        return acc;
    }, [] as awsx.cloudwatch.WidgetMetric[]);

    return [
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Uptime History',
            width: 12,
            height: 4,
            period: longPeriod,
            metrics: uptimeHistoryMetrics,
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Healthy History',
            width: 12,
            height: 4,
            period: longPeriod,
            metrics: healthyHistoryMetrics,
        }),
    ];
}
