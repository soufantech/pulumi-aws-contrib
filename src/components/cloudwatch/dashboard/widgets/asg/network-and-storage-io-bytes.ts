import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import { Widget, AsgConfig, WidgetExtraConfigs } from '../../../types';
import { MetricBuilder, MetricWidgetBuilder } from '../../builders';

export function networkAndStorageIoBytes(
    configs: AsgConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const { asgName } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;
    const height = constants.DEFAULT_HEIGHT;

    const networkOutMetric = new MetricBuilder({
        namespace: 'AWS/EC2',
        metricName: 'NetworkOut',
        dimensions: { AutoScalingGroupName: asgName },
    })
        .stat('Average')
        .label('NetworkOut');

    const networkInMetric = new MetricBuilder({
        namespace: 'AWS/EC2',
        metricName: 'NetworkIn',
        dimensions: { AutoScalingGroupName: asgName },
    })
        .stat('Average')
        .label('NetworkIn');

    const ebsWriteBytesMetric = new MetricBuilder({
        namespace: 'AWS/EC2',
        metricName: 'EBSWriteBytes',
        dimensions: { AutoScalingGroupName: asgName },
    })
        .stat('Average')
        .label('EBSWriteBytes');

    const ebsReadBytesMetric = new MetricBuilder({
        namespace: 'AWS/EC2',
        metricName: 'EBSReadBytes',
        dimensions: { AutoScalingGroupName: asgName },
    })
        .stat('Average')
        .label('EBSReadBytes');

    return [
        new MetricWidgetBuilder()
            .title('Network IO (bytes)')
            .view('timeSeries')
            .width(12)
            .height(height)
            .addMetric(networkOutMetric.period(longPeriod).build())
            .addMetric(networkInMetric.period(longPeriod).build())
            .build(),
        new MetricWidgetBuilder()
            .title('Storage IO (bytes)')
            .view('timeSeries')
            .width(12)
            .height(height)
            .addMetric(ebsWriteBytesMetric.period(longPeriod).build())
            .addMetric(ebsReadBytesMetric.period(longPeriod).build())
            .build(),
    ];
}
