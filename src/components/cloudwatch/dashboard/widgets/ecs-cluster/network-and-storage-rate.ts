import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import { Widget, EcsClusterConfig, WidgetExtraConfigs } from '../../../types';
import { MetricBuilder, MetricWidgetBuilder } from '../../builders';

export function networkAndStorageRate(
    configs: EcsClusterConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const { clusterName } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;
    const height = constants.DEFAULT_HEIGHT;

    const namespace = 'ECS/ContainerInsights';

    const networkTxBytesMetric = new MetricBuilder({
        namespace,
        metricName: 'NetworkTxBytes',
        dimensions: { ClusterName: clusterName },
    })
        .stat('Average')
        .label('NetworkTxBytes');

    const networkRxBytesMetric = new MetricBuilder({
        namespace,
        metricName: 'NetworkRxBytes',
        dimensions: { ClusterName: clusterName },
    })
        .stat('Average')
        .label('NetworkRxBytes');

    const storageWriteBytesMetric = new MetricBuilder({
        namespace,
        metricName: 'StorageWriteBytes',
        dimensions: { ClusterName: clusterName },
    })
        .stat('Average')
        .label('StorageWriteBytes');

    const storageReadBytesMetric = new MetricBuilder({
        namespace,
        metricName: 'StorageReadBytes',
        dimensions: { ClusterName: clusterName },
    })
        .stat('Average')
        .label('StorageReadBytes');

    return [
        new MetricWidgetBuilder()
            .title('Network Rate')
            .view('timeSeries')
            .width(12)
            .height(height)
            .period(longPeriod)
            .addMetric(networkTxBytesMetric.id('m1').period(longPeriod).build())
            .addMetric(networkRxBytesMetric.id('m2').period(longPeriod).build())
            .build(),
        new MetricWidgetBuilder()
            .title('Storage Rate')
            .view('timeSeries')
            .width(12)
            .height(height)
            .period(longPeriod)
            .addMetric(storageWriteBytesMetric.id('m1').period(longPeriod).build())
            .addMetric(storageReadBytesMetric.id('m2').period(longPeriod).build())
            .build(),
    ];
}
