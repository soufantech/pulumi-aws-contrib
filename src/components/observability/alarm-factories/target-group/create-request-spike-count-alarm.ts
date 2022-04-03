import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../constants';
import { TargetGroupConfig, AlarmExtraConfigs } from '../../types';

export default function createAlarm(
    name: string,
    threshold: number,
    configs: TargetGroupConfig,
    extraConfigs: AlarmExtraConfigs
): aws.cloudwatch.MetricAlarm {
    const { loadBalancer, targetGroup } = configs;

    const options: pulumi.ResourceOptions = {};
    if (extraConfigs.parent) {
        options.parent = extraConfigs.parent;
    }

    const requestCountMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        name: 'RequestCount',
        label: 'RequestCount',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
        statistic: 'Sum',
        period: constants.LONG_PERIOD,
    });

    return requestCountMetric.createAlarm(
        `${name}-request-spike-count`,
        {
            comparisonOperator: 'GreaterThanOrEqualToThreshold',
            threshold,
            evaluationPeriods: 1,
            alarmActions: extraConfigs.snsTopicArns,
            okActions: extraConfigs.snsTopicArns,
        },
        options
    );
}
