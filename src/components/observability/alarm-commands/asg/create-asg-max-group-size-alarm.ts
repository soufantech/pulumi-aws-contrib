import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../constants';
import { AsgConfig, AlarmExtraConfigs } from '../../types';

export default function createAlarm(
    name: string,
    threshold: number,
    configs: AsgConfig,
    extraConfigs?: AlarmExtraConfigs
): aws.cloudwatch.MetricAlarm {
    const { asgName } = configs;

    const logicalName = `${name}-asg-max-size`;

    const comparisonOperator = 'GreaterThanOrEqualToThreshold';
    const anomalyDetectionComparisonOperator = 'GreaterThanUpperThreshold';
    const namespace = 'AWS/AutoScaling';
    const stat = 'Maximum';
    const dimensions = { AutoScalingGroupName: asgName };

    let defaultDatapoints = constants.DATAPOINTS;
    if (threshold === 0) defaultDatapoints = constants.ANOMALY_DETECTION_DATAPOINTS;

    const period = extraConfigs?.period || constants.LONG_PERIOD;

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
            label: `AsgMaxSize (Expected)`,
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
                    expression: '(m1*100)/m2',
                    label: 'AsgMaxSize',
                    returnData: true,
                },
                {
                    id: 'm1',
                    metric: {
                        namespace,
                        metricName: 'GroupInServiceInstances',
                        dimensions,
                        stat,
                        period,
                    },
                },
                {
                    id: 'm2',
                    metric: {
                        namespace,
                        metricName: 'GroupMaxSize',
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
