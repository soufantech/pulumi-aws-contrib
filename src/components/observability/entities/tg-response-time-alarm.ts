import { AlarmExtraConfigs, TargetGroupConfig } from '../types';
import AlarmWithAnomalyDetection from './alarm-with-anomaly-detection';

export default class TgResponseTimeAlarm extends AlarmWithAnomalyDetection {
    constructor(
        name: string,
        threshold: number,
        { loadBalancer, targetGroup }: TargetGroupConfig,
        extraConfigs: AlarmExtraConfigs = {}
    ) {
        super(
            `${name}-target-response-time`,
            threshold,
            {
                comparisonOperator: 'GreaterThanOrEqualToThreshold',
                dimensions: {
                    LoadBalancer: loadBalancer,
                    TargetGroup: targetGroup,
                },
                metricName: 'TargetResponseTime',
                statistics: 'Average',
                namespace: 'AWS/ApplicationELB',
                isShortPeriod: true,
            },
            extraConfigs,
            {
                standardDeviation: extraConfigs.standardDeviation,
                anomalyComparison: 'GreaterThanUpperThreshold',
            }
        );
    }
}
