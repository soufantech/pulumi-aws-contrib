import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../constants';
import { EcsServiceConfig, AlarmExtraConfigs } from '../../types';

export default function createAlarm(
    name: string,
    threshold: number,
    configs: EcsServiceConfig,
    extraConfigs?: AlarmExtraConfigs
): aws.cloudwatch.MetricAlarm {
    const { clusterName, serviceName } = configs;

    const logicalName = `${name}-storage-read-bytes`;

    const comparisonOperator = 'GreaterThanOrEqualToThreshold';
    const anomalyDetectionComparisonOperator = 'GreaterThanUpperThreshold';
    const namespace = 'ECS/ContainerInsights';
    const metricName = 'StorageReadBytes';
    const stat = 'Average';
    const dimensions = { ClusterName: clusterName, ServiceName: serviceName };

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
        metricArgs.thresholdMetricId = 'e1';
        metricArgs.comparisonOperator = anomalyDetectionComparisonOperator;
        metricQueries.push({
            id: 'e1',
            expression: `ANOMALY_DETECTION_BAND(m1, ${standardDeviation})`,
            label: `${metricName} (Expected)`,
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
                    id: 'm1',
                    label: metricName,
                    metric: { namespace, metricName, dimensions, stat, period },
                    returnData: true,
                },
            ],
            alarmActions: extraConfigs?.snsTopicArns,
            okActions: extraConfigs?.snsTopicArns,
            ...metricArgs,
        },
        options,
    );
}
