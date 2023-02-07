/* eslint-disable sonarjs/no-duplicate-string */
import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import { Widget, TargetGroupConfig, WidgetExtraConfigs } from '../../../types';
import { ExpressionBuilder, MetricBuilder, MetricWidgetBuilder } from '../../builders';

export function uptimeAndHealthy(
    configs: TargetGroupConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const { loadBalancer, targetGroup } = configs;

    const shortPeriod = extraConfigs?.shortPeriod || constants.DEFAULT_PERIOD;
    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const namespace = 'AWS/ApplicationELB';

    const requestCountMetric = new MetricBuilder({
        namespace,
        metricName: 'RequestCount',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
    })
        .stat('SampleCount')
        .label('RequestCount');

    const httpCodeTarget5xxCountMetric = new MetricBuilder({
        namespace,
        metricName: 'HTTPCode_Target_5XX_Count',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
    })
        .stat('SampleCount')
        .label('HTTPCode_Target_5XX_Count');

    const uptimeExpression = new ExpressionBuilder({
        expression: '(1-(m2/m1))*100',
    })
        .label('Uptime')
        .id('e1');

    const healthyHostCountMetric = new MetricBuilder({
        namespace,
        metricName: 'HealthyHostCount',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
    })
        .stat('Maximum')
        .label('HealthyHostCount');

    const unhealthyHostCountMetric = new MetricBuilder({
        namespace,
        metricName: 'UnHealthyHostCount',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
    })
        .stat('Maximum')
        .label('UnHealthyHostCount');

    const healthyRateExpression = new ExpressionBuilder({
        expression: '(1-(m2/m1))*100',
    })
        .label('HealthyRate')
        .id('e1');

    return [
        new MetricWidgetBuilder()
            .title('Uptime Status')
            .view('singleValue')
            .width(3)
            .height(5)
            .period(shortPeriod)
            .addMetric(requestCountMetric.id('m1').period(shortPeriod).visible(false).build())
            .addMetric(
                httpCodeTarget5xxCountMetric.id('m2').period(shortPeriod).visible(false).build()
            )
            .addMetric(uptimeExpression.build())
            .build(),
        new MetricWidgetBuilder()
            .title('Uptime History')
            .view('timeSeries')
            .width(9)
            .height(5)
            .period(longPeriod)
            .addMetric(requestCountMetric.id('m1').period(longPeriod).visible(false).build())
            .addMetric(
                httpCodeTarget5xxCountMetric.id('m2').period(longPeriod).visible(false).build()
            )
            .addMetric(uptimeExpression.build())
            .build(),
        new MetricWidgetBuilder()
            .title('Healthy Status')
            .view('singleValue')
            .width(6)
            .height(5)
            .period(shortPeriod)
            .addMetric(healthyHostCountMetric.period(shortPeriod).build())
            .addMetric(unhealthyHostCountMetric.period(shortPeriod).build())
            .build(),
        new MetricWidgetBuilder()
            .title('Healthy History')
            .view('timeSeries')
            .width(6)
            .height(5)
            .period(longPeriod)
            .addMetric(healthyHostCountMetric.id('m1').period(longPeriod).visible(false).build())
            .addMetric(unhealthyHostCountMetric.id('m2').period(longPeriod).visible(false).build())
            .addMetric(healthyRateExpression.build())
            .build(),
    ];
}
