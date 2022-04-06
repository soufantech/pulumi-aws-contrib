import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';

import * as constants from '../../constants';
import { AsgConfig } from '../../types';

export default function createWidgets(configs: AsgConfig): Widget[] {
    const { asgName } = configs;

    const networkPacketsOutMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/EC2',
        name: 'NetworkPacketsOut',
        label: 'NetworkPacketsOut',
        dimensions: { AutoScalingGroupName: asgName },
        statistic: 'Average',
    });

    const networkPacketsInMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/EC2',
        name: 'NetworkPacketsIn',
        label: 'NetworkPacketsIn',
        dimensions: { AutoScalingGroupName: asgName },
        statistic: 'Average',
    });

    const ebsWriteOpsMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/EC2',
        name: 'EBSWriteOps',
        label: 'EBSWriteOps',
        dimensions: { AutoScalingGroupName: asgName },
        statistic: 'Average',
    });

    const ebsReadOpsMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/EC2',
        name: 'EBSReadOps',
        label: 'EBSReadOps',
        dimensions: { AutoScalingGroupName: asgName },
        statistic: 'Average',
    });

    return [
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Network IO (count)',
            width: 12,
            height: 6,
            metrics: [
                networkPacketsOutMetric.withPeriod(constants.LONG_PERIOD),
                networkPacketsInMetric.withPeriod(constants.LONG_PERIOD),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Storage IO (count)',
            width: 12,
            height: 6,
            metrics: [
                ebsWriteOpsMetric.withPeriod(constants.LONG_PERIOD),
                ebsReadOpsMetric.withPeriod(constants.LONG_PERIOD),
            ],
        }),
    ];
}
