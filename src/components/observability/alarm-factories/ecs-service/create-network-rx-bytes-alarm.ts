import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
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

    const period = extraConfigs?.period || constants.LONG_PERIOD;

    const evaluationPeriods = extraConfigs?.evaluationPeriods || constants.DATAPOINTS;
    const datapointsToAlarm =
        extraConfigs?.datapointsToAlarm || extraConfigs?.evaluationPeriods || constants.DATAPOINTS;

    const options: pulumi.ResourceOptions = {};
    if (extraConfigs?.parent) {
        options.parent = extraConfigs?.parent;
    }

    const networkRxBytesMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'NetworkRxBytes',
        label: 'NetworkRxBytes',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
        statistic: 'Average',
        period,
    });

    return networkRxBytesMetric.createAlarm(
        `${name}-network-rx-bytes`,
        {
            comparisonOperator: 'GreaterThanOrEqualToThreshold',
            threshold,
            evaluationPeriods,
            datapointsToAlarm,
            alarmActions: extraConfigs?.snsTopicArns,
            okActions: extraConfigs?.snsTopicArns,
        },
        options
    );
}
