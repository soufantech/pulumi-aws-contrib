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

    const logicalName = `${name}-uptime`;

    const comparisonOperator = 'LessThanOrEqualToThreshold';
    const anomalyDetectionComparisonOperator = 'LessThanLowerThreshold';
    const namespace = 'AWS/ApplicationELB';
    const stat = 'Sum';
    const dimensions = { LoadBalancer: loadBalancer, TargetGroup: targetGroup };

    let defaultDatapoints = constants.DATAPOINTS;
    if (threshold === 0) defaultDatapoints = constants.ANOMALY_DETECTION_DATAPOINTS;

    const period = extraConfigs?.period || constants.SHORT_PERIOD;

    const evaluationPeriods = extraConfigs?.evaluationPeriods || defaultDatapoints;
    const datapointsToAlarm =
        extraConfigs?.datapointsToAlarm || extraConfigs?.evaluationPeriods || defaultDatapoints;
    const treatMissingData = extraConfigs?.treatMissingData || constants.TREAT_MISSING_DATA;
    const standardDeviation = extraConfigs?.standardDeviation || constants.STANDARD_DEVIATION;

    const options: pulumi.ResourceOptions = {};
    if (extraConfigs?.parent) {
        options.parent = extraConfigs?.parent;
    }

    const metricQueries: aws.types.input.cloudwatch.MetricAlarmMetricQuery[] = [];
    const metricArgs: Partial<aws.cloudwatch.MetricAlarmArgs> = {};

    if (threshold === 0) {
        metricArgs.thresholdMetricId = 'e2';
        metricArgs.comparisonOperator = anomalyDetectionComparisonOperator;
        metricQueries.push({
            id: 'e2',
            expression: `ANOMALY_DETECTION_BAND(e1, ${standardDeviation})`,
            label: `Uptime (Expected)`,
            returnData: true,
        })
    } else {
        metricArgs.threshold = threshold;
    }

    return new aws.cloudwatch.MetricAlarm(
        logicalName,
        {
            comparisonOperator,
            evaluationPeriods,
            datapointsToAlarm,
            treatMissingData,
            metricQueries: [
                ...metricQueries,
                {
                    id: 'e1',
                    expression: '(1-(m2/m1))*100',
                    label: 'Uptime',
                    returnData: true,
                },
                {
                    id: 'm1',
                    metric: {
                        namespace,
                        metricName: 'RequestCount',
                        dimensions,
                        stat,
                        period,
                    },
                },
                {
                    id: 'm2',
                    metric: {
                        namespace,
                        metricName: 'HTTPCode_ELB_5XX_Count',
                        dimensions,
                        stat,
                        period,
                    },
                },
            ],
            alarmActions: extraConfigs?.snsTopicArns,
            okActions: extraConfigs?.snsTopicArns,
            ...metricArgs,
        },
        options
    );
}
