import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import { Widget, AsgConfig, WidgetExtraConfigs } from '../../../types';
import { MetricBuilder, MetricWidgetBuilder } from '../../builders';

export function networkAndStorageIoCount(
    configs: AsgConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const { asgName } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const networkPacketsOutMetric = new MetricBuilder({
        namespace: 'AWS/EC2',
        metricName: 'NetworkPacketsOut',
        dimensions: { AutoScalingGroupName: asgName },
    })
        .stat('Average')
        .label('NetworkPacketsOut');

    const networkPacketsInMetric = new MetricBuilder({
        namespace: 'AWS/EC2',
        metricName: 'NetworkPacketsIn',
        dimensions: { AutoScalingGroupName: asgName },
    })
        .stat('Average')
        .label('NetworkPacketsIn');

    const ebsWriteOpsMetric = new MetricBuilder({
        namespace: 'AWS/EC2',
        metricName: 'EBSWriteOps',
        dimensions: { AutoScalingGroupName: asgName },
    })
        .stat('Average')
        .label('EBSWriteOps');

    const ebsReadOpsMetric = new MetricBuilder({
        namespace: 'AWS/EC2',
        metricName: 'EBSReadOps',
        dimensions: { AutoScalingGroupName: asgName },
    })
        .stat('Average')
        .label('EBSReadOps');

    return [
        new MetricWidgetBuilder()
            .title('Network IO (count)')
            .view('timeSeries')
            .width(12)
            .height(6)
            .addMetric(networkPacketsOutMetric.period(longPeriod).build())
            .addMetric(networkPacketsInMetric.period(longPeriod).build())
            .build(),
        new MetricWidgetBuilder()
            .title('Storage IO (count)')
            .view('timeSeries')
            .width(12)
            .height(6)
            .addMetric(ebsWriteOpsMetric.period(longPeriod).build())
            .addMetric(ebsReadOpsMetric.period(longPeriod).build())
            .build(),
    ];
}
