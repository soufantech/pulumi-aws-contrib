import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../constants';
import { TargetGroupConfig, AlarmExtraConfigs } from '../../types';

export default function createAlarm(
    name: string,
    threshold: number,
    configs: TargetGroupConfig,
    extraConfigs?: AlarmExtraConfigs
): aws.cloudwatch.MetricAlarm {
    const { loadBalancer, targetGroup } = configs;

    const period = extraConfigs?.period || constants.SHORT_PERIOD;

    const evaluationPeriods = extraConfigs?.evaluationPeriods || constants.DATAPOINTS;
    const datapointsToAlarm =
        extraConfigs?.datapointsToAlarm || extraConfigs?.evaluationPeriods || constants.DATAPOINTS;
    const treatMissingData = extraConfigs?.treatMissingData || constants.TREAT_MISSING_DATA;

    const options: pulumi.ResourceOptions = {};
    if (extraConfigs?.parent) {
        options.parent = extraConfigs?.parent;
    }

    return new aws.cloudwatch.MetricAlarm(
        `${name}-uptime`,
        {
            comparisonOperator: 'LessThanOrEqualToThreshold',
            threshold,
            evaluationPeriods,
            datapointsToAlarm,
            treatMissingData,
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
                        period,
                    },
                },
                {
                    id: 'm2',
                    metric: {
                        namespace: 'AWS/ApplicationELB',
                        metricName: 'HTTPCode_ELB_5XX_Count',
                        dimensions: { LoadBalancer: loadBalancer, TargetGroup: targetGroup },
                        stat: 'Sum',
                        period,
                    },
                },
            ],
            alarmActions: extraConfigs?.snsTopicArns,
            okActions: extraConfigs?.snsTopicArns,
        },
        options
    );
}
