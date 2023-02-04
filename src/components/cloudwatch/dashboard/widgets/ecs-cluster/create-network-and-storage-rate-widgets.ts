/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx/classic';
import { Widget } from '@pulumi/awsx/classic/cloudwatch';

import * as constants from '../../../constants';
import { EcsClusterConfig, WidgetExtraConfigs } from '../../../types';

export function createNetworkAndStorageRateWidgets(
    configs: EcsClusterConfig,
    extraConfigs?: WidgetExtraConfigs
): Widget[] {
    const { clusterName } = configs;

    const longPeriod = extraConfigs?.longPeriod || constants.DEFAULT_PERIOD;

    const networkTxBytesMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'NetworkTxBytes',
        label: 'NetworkTxBytes',
        dimensions: { ClusterName: clusterName },
        statistic: 'Average',
    });

    const networkRxBytesMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'NetworkRxBytes',
        label: 'NetworkRxBytes',
        dimensions: { ClusterName: clusterName },
        statistic: 'Average',
    });

    const storageWriteBytesMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'StorageWriteBytes',
        label: 'StorageWriteBytes',
        dimensions: { ClusterName: clusterName },
        statistic: 'Average',
    });

    const storageReadBytesMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'StorageReadBytes',
        label: 'StorageReadBytes',
        dimensions: { ClusterName: clusterName },
        statistic: 'Average',
    });

    return [
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Network Rate',
            width: 12,
            height: 6,
            metrics: [
                networkTxBytesMetric.withPeriod(longPeriod),
                networkRxBytesMetric.withPeriod(longPeriod),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Storage Rate',
            width: 12,
            height: 6,
            metrics: [
                storageWriteBytesMetric.withPeriod(longPeriod),
                storageReadBytesMetric.withPeriod(longPeriod),
            ],
        }),
    ];
}
