/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx/classic';
import { Widget } from '@pulumi/awsx/classic/cloudwatch';

import * as constants from '../../../constants';
import { TargetGroupConfig, WidgetExtraConfigs } from '../../../types';

export default function createWidgets(
    configs: TargetGroupConfig,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const { loadBalancer, targetGroup } = configs;

    const shortPeriod = extraConfigs?.shortPeriod || constants.DEFAULT_PERIOD;
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const requestCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        name: 'RequestCount',
        label: 'RequestCount',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
        statistic: 'SampleCount',
    });

    const httpCodeTarget5xxCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        name: 'HTTPCode_Target_5XX_Count',
        label: 'HTTPCode_Target_5XX_Count',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
        statistic: 'SampleCount',
    });

    const uptimeExpression = new awsx.cloudwatch.ExpressionWidgetMetric(
        '(1-(m2/m1))*100',
        'Uptime',
        'e1'
    );

    const healthyHostCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        name: 'HealthyHostCount',
        label: 'HealthyHostCount',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
        statistic: 'Maximum',
    });

    const unhealthyHostCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        name: 'UnHealthyHostCount',
        label: 'UnHealthyHostCount',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
        statistic: 'Maximum',
    });

    const healthyRateExpression = new awsx.cloudwatch.ExpressionWidgetMetric(
        '(1-(m2/m1))*100',
        'HealthyRate',
        'e1'
    );

    return [
        new awsx.cloudwatch.SingleNumberMetricWidget({
            title: 'Uptime Status',
            width: 3,
            height: 4,
            period: shortPeriod,
            metrics: [
                uptimeExpression,
                requestCountMetric.withId('m1').withPeriod(shortPeriod).withVisible(false),
                httpCodeTarget5xxCountMetric
                    .withId('m2')
                    .withPeriod(shortPeriod)
                    .withVisible(false),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Uptime History',
            width: 9,
            height: 4,
            period: longPeriod,
            metrics: [
                uptimeExpression,
                requestCountMetric.withId('m1').withPeriod(longPeriod).withVisible(false),
                httpCodeTarget5xxCountMetric.withId('m2').withPeriod(longPeriod).withVisible(false),
            ],
        }),
        new awsx.cloudwatch.SingleNumberMetricWidget({
            title: 'Healthy Status',
            width: 6,
            height: 4,
            period: shortPeriod,
            metrics: [
                healthyHostCountMetric.withPeriod(shortPeriod),
                unhealthyHostCountMetric.withPeriod(shortPeriod),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Healthy History',
            width: 6,
            height: 4,
            period: longPeriod,
            metrics: [
                healthyRateExpression,
                healthyHostCountMetric.withId('m1').withPeriod(longPeriod).withVisible(false),
                unhealthyHostCountMetric.withId('m2').withPeriod(longPeriod).withVisible(false),
            ],
        }),
    ];
}
