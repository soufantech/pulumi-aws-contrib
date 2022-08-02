import { AlarmExtraConfigs, TargetGroupConfig } from '../types';
import AlarmWithAnomalyDetection from './alarm-with-anomaly-detection';

export default class TgUptimeAlarm extends AlarmWithAnomalyDetection {
    constructor(
        name: string,
        threshold: number,
        { loadBalancer, targetGroup }: TargetGroupConfig,
        extraConfigs: AlarmExtraConfigs = {}
    ) {
        super(
            `${name}-uptime`,
            threshold,
            {
                comparisonOperator: 'LessThanOrEqualToThreshold',
                dimensions: {
                    LoadBalancer: loadBalancer,
                    TargetGroup: targetGroup,
                },
                metricName: 'RequestCount',
                statistics: 'Sum',
                namespace: 'AWS/ApplicationELB',
                isShortPeriod: true,
            },
            extraConfigs,
            {
                expressionId: 'e2',
                metricToWatchId: 'e1',
                standardDeviation: extraConfigs.standardDeviation,
                anomalyComparison: 'LessThanLowerThreshold',
            }
        );
        this.metricQueries.push(
            {
                id: 'e1',
                expression: '(1-(m2/m1))*100',
                label: 'Uptime',
                returnData: true,
            },
            {
                id: 'm2',
                metric: {
                    namespace: this.alarmConfig.namespace,
                    metricName: 'HTTPCode_ELB_5XX_Count',
                    dimensions: this.alarmConfig.dimensions,
                    stat: this.alarmConfig.statistics,
                    period: this.extraConfigs.period,
                },
            }
        );
    }
}
