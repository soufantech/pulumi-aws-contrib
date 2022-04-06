import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../constants';
import { AsgConfig, AlarmExtraConfigs } from '../../types';

export default function createAlarm(
    name: string,
    threshold: number,
    configs: AsgConfig,
    extraConfigs: AlarmExtraConfigs
): aws.cloudwatch.MetricAlarm {
    const { asgName } = configs;

    const options: pulumi.ResourceOptions = {};
    if (extraConfigs.parent) {
        options.parent = extraConfigs.parent;
    }

    return new aws.cloudwatch.MetricAlarm(
        `${name}-asg-max-size`,
        {
            comparisonOperator: 'GreaterThanOrEqualToThreshold',
            threshold,
            evaluationPeriods: constants.DATAPOINTS,
            metricQueries: [
                {
                    id: 'e1',
                    expression: '(m1*100)/m2',
                    label: 'AsgMaxSize',
                    returnData: true,
                },
                {
                    id: 'm1',
                    metric: {
                        namespace: 'AWS/AutoScaling',
                        metricName: 'GroupInServiceInstances',
                        dimensions: { AutoScalingGroupName: asgName },
                        stat: 'Maximum',
                        period: constants.LONG_PERIOD,
                    },
                },
                {
                    id: 'm2',
                    metric: {
                        namespace: 'AWS/AutoScaling',
                        metricName: 'GroupMaxSize',
                        dimensions: { AutoScalingGroupName: asgName },
                        stat: 'Maximum',
                        period: constants.LONG_PERIOD,
                    },
                },
            ],
            alarmActions: extraConfigs.snsTopicArns,
            okActions: extraConfigs.snsTopicArns,
        },
        options
    );
}