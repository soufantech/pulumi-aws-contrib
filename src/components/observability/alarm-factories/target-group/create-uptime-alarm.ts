import * as aws from '@pulumi/aws';
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

    return new aws.cloudwatch.MetricAlarm(
        `${name}-uptime`,
        {
            comparisonOperator: 'LessThanOrEqualToThreshold',
            threshold,
            evaluationPeriods: constants.DATAPOINTS,
            metricQueries: [
                {
                    id: 'e1',
                    expression: '(1-(m2/m1))*100',
                    label: 'Uptime',
                    returnData: true,
                },
                {
                    id: 'm1',
                    metric: {
                        namespace: 'AWS/ApplicationELB',
                        metricName: 'RequestCount',
                        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
                        stat: 'Sum',
                        period: constants.SHORT_PERIOD,
                    },
                },
                {
                    id: 'm2',
                    metric: {
                        namespace: 'AWS/ApplicationELB',
                        metricName: 'HTTPCode_ELB_5XX_Count',
                        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
                        stat: 'Sum',
                        period: constants.SHORT_PERIOD,
                    },
                },
            ],
            alarmActions: extraConfigs.snsTopicArns,
            okActions: extraConfigs.snsTopicArns,
        },
        options
    );
}
