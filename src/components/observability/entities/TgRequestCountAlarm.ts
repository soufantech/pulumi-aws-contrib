import { AlarmExtraConfigs, TargetGroupConfig } from '../types';
import AlarmWithAnomalyDetection from './AlarmWithAnomalyDetection';

export default class TgRequestCountAlarm extends AlarmWithAnomalyDetection {
    constructor(
        name: string,
        threshold: number,
        { loadBalancer, targetGroup }: TargetGroupConfig,
        extraConfigs: AlarmExtraConfigs = {}
    ) {
        super(
            `${name}-request-count`,
            threshold,
            {
                comparisonOperator: 'GreaterThanOrEqualToThreshold',
                dimensions: {
                    LoadBalancer: loadBalancer,
                    TargetGroup: targetGroup,
                },
                metricName: 'RequestCount',
                statistics: 'Sum',
                namespace: 'AWS/ApplicationELB',
            },
            extraConfigs
        );
        if (this.hasAnomalyDetection) {
            this.setComparisonOperator('GreaterThanUpperThreshold');
        }
    }
}
