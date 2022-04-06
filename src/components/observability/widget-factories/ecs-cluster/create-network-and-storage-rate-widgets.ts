/* eslint-disable sonarjs/no-duplicate-string */
import * as awsx from '@pulumi/awsx';
import { Widget } from '@pulumi/awsx/cloudwatch';

import * as constants from '../../constants';
import { EcsClusterConfig } from '../../types';

export default function createWidgets(configs: EcsClusterConfig): Widget[] {
    const { clusterName } = configs;

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
                networkTxBytesMetric.withPeriod(constants.LONG_PERIOD),
                networkRxBytesMetric.withPeriod(constants.LONG_PERIOD),
            ],
        }),
        new awsx.cloudwatch.LineGraphMetricWidget({
            title: 'Storage Rate',
            width: 12,
            height: 6,
            metrics: [
                storageWriteBytesMetric.withPeriod(constants.LONG_PERIOD),
                storageReadBytesMetric.withPeriod(constants.LONG_PERIOD),
            ],
        }),
    ];
}
