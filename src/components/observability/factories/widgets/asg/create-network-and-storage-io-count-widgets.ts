import * as awsx from '@pulumi/awsx/classic';
import { Widget } from '@pulumi/awsx/classic/cloudwatch';

import * as constants from '../../../constants';
import { AsgConfig, WidgetExtraConfigs } from '../../../types';

export default function createWidgets(
    configs: AsgConfig,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const { asgName } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

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
                networkPacketsOutMetric.withPeriod(longPeriod),
                networkPacketsInMetric.withPeriod(longPeriod),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Storage IO (count)',
            width: 12,
            height: 6,
            metrics: [
                ebsWriteOpsMetric.withPeriod(longPeriod),
                ebsReadOpsMetric.withPeriod(longPeriod),
            ],
        }),
    ];
}
