import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';

import * as constants from '../constants';
import { ClusterConfig, AlarmExtraConfigs } from '../types';

export default function createAlarm(
    name: string,
    threshold: number,
    configs: ClusterConfig,
    extraConfigs: AlarmExtraConfigs
): aws.cloudwatch.MetricAlarm {
    const { clusterName } = configs;

    const options: pulumi.ResourceOptions = {};
    if (extraConfigs.parent) {
        options.parent = extraConfigs.parent;
    }

    const cpuUtilization = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ECS',
        name: 'CPUUtilization',
        label: 'CPUUtilization',
        dimensions: { ClusterName: clusterName },
        statistic: 'Average',
        period: constants.LONG_PERIOD,
    });

    return cpuUtilization.createAlarm(
        `${name}-cpu-utilization`,
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
