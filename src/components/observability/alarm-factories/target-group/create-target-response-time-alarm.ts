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

    const targetResponseTimeMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        name: 'TargetResponseTime',
        label: 'TargetResponseTime',
        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
        statistic: 'Average',
        period: constants.SHORT_PERIOD,
    });

    return targetResponseTimeMetric.createAlarm(
        `${name}-target-response-time`,
        {
            comparisonOperator: 'GreaterThanOrEqualToThreshold',
            threshold,
            evaluationPeriods: constants.DATAPOINTS,
            alarmActions: extraConfigs.snsTopicArns,
            okActions: extraConfigs.snsTopicArns,
        },
        options
    );
}