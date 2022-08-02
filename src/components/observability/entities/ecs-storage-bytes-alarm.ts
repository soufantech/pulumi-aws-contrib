import { AlarmExtraConfigs, EcsServiceConfig } from '../types';
import AlarmWithAnomalyDetection from './alarm-with-anomaly-detection';

export default class EcsStorageBytesAlarm extends AlarmWithAnomalyDetection {
    constructor(
        name: string,
        threshold: number,
        { clusterName, serviceName }: EcsServiceConfig,
        extraConfigs: AlarmExtraConfigs,
        mode: 'write' | 'read'
    ) {
        super(
            `${name}-${mode === 'write' ? 'storage-write-bytes' : 'storage-read-byte'}`,
            threshold,
            {
                comparisonOperator: 'GreaterThanOrEqualToThreshold',
                dimensions: {
                    ClusterName: clusterName,
                    ServiceName: serviceName,
                },
                metricName: mode === 'write' ? 'StorageWriteBytes' : 'StorageReadBytes',
                statistics: 'Average',
                namespace: 'ECS/ContainerInsights',
                isShortPeriod: false,
            },
            extraConfigs,
            {
                standardDeviation: extraConfigs.standardDeviation,
                anomalyComparison: 'GreaterThanUpperThreshold',
            }
        );
    }
}
