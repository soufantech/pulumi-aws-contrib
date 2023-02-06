import * as awsx from '@pulumi/awsx/classic';
import { Widget } from '@pulumi/awsx/classic/cloudwatch';

import * as constants from '../../../constants';
import { AsgConfig, WidgetExtraConfigs } from '../../../types';

export function networkAndStorageIoBytes(
    configs: AsgConfig,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const { asgName } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const networkOutMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/EC2',
        name: 'NetworkOut',
        label: 'NetworkOut',
        dimensions: { AutoScalingGroupName: asgName },
        statistic: 'Average',
    });

    const networkInMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/EC2',
        name: 'NetworkIn',
        label: 'NetworkIn',
        dimensions: { AutoScalingGroupName: asgName },
        statistic: 'Average',
    });

    const ebsWriteBytesMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/EC2',
        name: 'EBSWriteBytes',
        label: 'EBSWriteBytes',
        dimensions: { AutoScalingGroupName: asgName },
        statistic: 'Average',
    });

    const ebsReadBytesMetric = new awsx.cloudwatch.Metric({
        namespace: 'AWS/EC2',
        name: 'EBSReadBytes',
        label: 'EBSReadBytes',
        dimensions: { AutoScalingGroupName: asgName },
        statistic: 'Average',
    });

    return [
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Network IO (bytes)',
            width: 12,
            height: 6,
            metrics: [
                networkOutMetric.withPeriod(longPeriod),
                networkInMetric.withPeriod(longPeriod),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Storage IO (bytes)',
            width: 12,
            height: 6,
            metrics: [
                ebsWriteBytesMetric.withPeriod(longPeriod),
                ebsReadBytesMetric.withPeriod(longPeriod),
            ],
        }),
    ];
}
