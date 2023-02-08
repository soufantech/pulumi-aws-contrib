import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../../constants';
import { Widget, EcsServiceConfig, WidgetExtraConfigs } from '../../../types';
import { MetricBuilder, MetricWidgetBuilder } from '../../builders';

export function networkAndStorage(
    configs: EcsServiceConfig,
    extraConfigs?: WidgetExtraConfigs
): pulumi.Output<Widget>[] {
    const { clusterName, serviceName } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;
    const height = constants.DEFAULT_HEIGHT;

    const namespace = 'ECS/ContainerInsights';

    const networkTxBytesMetric = new MetricBuilder({
        namespace,
        metricName: 'NetworkTxBytes',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
    })
        .stat('Average')
        .label('NetworkTxBytes');

    const networkRxBytesMetric = new MetricBuilder({
        namespace,
        metricName: 'NetworkRxBytes',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
    })
        .stat('Average')
        .label('NetworkRxBytes');

    const storageWriteBytesMetric = new MetricBuilder({
        namespace,
        metricName: 'StorageWriteBytes',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
    })
        .stat('Average')
        .label('StorageWriteBytes');

    const storageReadBytesMetric = new MetricBuilder({
        namespace,
        metricName: 'StorageReadBytes',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
    })
        .stat('Average')
        .label('StorageReadBytes');

    return [
        new MetricWidgetBuilder()
            .title('Network Rate')
            .view('timeSeries')
            .width(12)
            .height(height)
            .addMetric(networkTxBytesMetric.period(longPeriod).build())
            .addMetric(networkRxBytesMetric.period(longPeriod).build())
            .build(),
        new MetricWidgetBuilder()
            .title('Storage Rate')
            .view('timeSeries')
            .width(12)
            .height(height)
            .addMetric(storageWriteBytesMetric.period(longPeriod).build())
            .addMetric(storageReadBytesMetric.period(longPeriod).build())
            .build(),
    ];
}
