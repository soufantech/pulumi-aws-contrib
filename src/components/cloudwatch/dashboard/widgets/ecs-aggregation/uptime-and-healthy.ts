import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import {
    MetricWidget,
    Widget,
    EcsAggregationConfig,
    TargetGroupConfig,
    WidgetExtraConfigs,
} from '../../../types';
import { ExpressionBuilder, MetricBuilder, MetricWidgetBuilder } from '../../builders';

export function uptimeAndHealthy(
    configs: EcsAggregationConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<pulumi.Output<Widget>[]> {
    const { services } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;
    const height = constants.DEFAULT_HEIGHT;

    const namespace = 'AWS/ApplicationELB';

    const albConfigsOutput = services
        .map((service) => service.targetGroupConfig)
        .filter((targetGroupConfig) => targetGroupConfig) as TargetGroupConfig[];

    if (!albConfigsOutput.length) {
        return pulumi.output([]);
    }

    return pulumi.all(albConfigsOutput).apply((albConfigs) => {
        const uptimeHistoryMetrics = albConfigs.reduce(
            (acc, albConfig, index) => {
                const firstMetricId = `m${index * 2 + 1}`;
                const secondMetricId = `m${index * 2 + 2}`;
                const expressionId = `e${index + 1}`;

                const targetGroupName = albConfig.targetGroup.split('/')[1];

                acc.push(
                    new MetricBuilder({
                        namespace,
                        metricName: 'RequestCount',
                        dimensions: {
                            LoadBalancer: albConfig.loadBalancer,
                            TargetGroup: albConfig.targetGroup,
                        },
                    })
                        .stat('SampleCount')
                        .period(longPeriod)
                        .label(`RequestCount ${targetGroupName}`)
                        .id(firstMetricId)
                        .visible(false)
                        .build()
                );

                acc.push(
                    new MetricBuilder({
                        namespace,
                        metricName: 'HTTPCode_Target_5XX_Count',
                        dimensions: {
                            LoadBalancer: albConfig.loadBalancer,
                            TargetGroup: albConfig.targetGroup,
                        },
                    })
                        .stat('SampleCount')
                        .period(longPeriod)
                        .label(`HTTPCode_Target_5XX_Count ${targetGroupName}`)
                        .id(secondMetricId)
                        .visible(false)
                        .build()
                );

                acc.push(
                    new ExpressionBuilder({
                        expression: `(1-(${secondMetricId}/${firstMetricId}))*100`,
                    })
                        .label(targetGroupName)
                        .id(expressionId)
                        .build()
                );

                return acc;
            },
            [] as MetricWidget['properties']['metrics']
        );

        const healthyHistoryMetrics = albConfigs.reduce(
            (acc, albConfig, index) => {
                const firstMetricId = `m${index * 2 + 1}`;
                const secondMetricId = `m${index * 2 + 2}`;
                const expressionId = `e${index + 1}`;

                const targetGroupName = albConfig.targetGroup.split('/')[1];

                acc.push(
                    new MetricBuilder({
                        namespace,
                        metricName: 'HealthyHostCount',
                        dimensions: {
                            LoadBalancer: albConfig.loadBalancer,
                            TargetGroup: albConfig.targetGroup,
                        },
                    })
                        .stat('Maximum')
                        .period(longPeriod)
                        .label(`HealthyHostCount ${targetGroupName}`)
                        .id(firstMetricId)
                        .visible(false)
                        .build()
                );

                acc.push(
                    new MetricBuilder({
                        namespace,
                        metricName: 'UnHealthyHostCount',
                        dimensions: {
                            LoadBalancer: albConfig.loadBalancer,
                            TargetGroup: albConfig.targetGroup,
                        },
                    })
                        .stat('Maximum')
                        .period(longPeriod)
                        .label(`UnHealthyHostCount ${targetGroupName}`)
                        .id(secondMetricId)
                        .visible(false)
                        .build()
                );

                acc.push(
                    new ExpressionBuilder({
                        expression: `(1-(${secondMetricId}/${firstMetricId}))*100`,
                    })
                        .label(targetGroupName)
                        .id(expressionId)
                        .build()
                );

                return acc;
            },
            [] as MetricWidget['properties']['metrics']
        );

        const uptimeHistoryWidget = new MetricWidgetBuilder()
            .title('Uptime History')
            .view('timeSeries')
            .width(12)
            .height(height)
            .period(longPeriod)
            .yAxis({ left: { max: 100 } });
        uptimeHistoryMetrics.forEach((metric) => uptimeHistoryWidget.addMetric(metric));

        const healthyHistoryWidget = new MetricWidgetBuilder()
            .title('Healthy History')
            .view('timeSeries')
            .width(12)
            .height(height)
            .period(longPeriod)
            .yAxis({ left: { max: 100 } });
        healthyHistoryMetrics.forEach((metric) => healthyHistoryWidget.addMetric(metric));

        return [uptimeHistoryWidget.build(), healthyHistoryWidget.build()];
    });
}
