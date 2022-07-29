import * as constants from '../constants';
import { AlarmExtraConfigs } from '../types';
import Alarm from './alarm';

interface AnomalyDetectionConfig {
    expressionId?: string;
    metricToWatchId?: string;
    standardDeviation?: number;
    anomalyComparison: string;
}
export default class AlarmWithAnomalyDetection extends Alarm {
    hasAnomalyDetection: boolean;

    constructor(
        name: string,
        threshold: number,
        alarmConfig: Alarm['alarmConfig'],
        extraConfigs: AlarmExtraConfigs,
        anomalyDetectionConfig: AnomalyDetectionConfig
    ) {
        super(name, threshold, alarmConfig, extraConfigs);
        this.hasAnomalyDetection = threshold === 0;

        if (this.hasAnomalyDetection) {
            delete this.metricArgs.threshold;

            const standardDeviation =
                anomalyDetectionConfig.standardDeviation || constants.STANDARD_DEVIATION;
            const expressionId = anomalyDetectionConfig.expressionId || 'e1';
            const metricToWatchId = anomalyDetectionConfig.metricToWatchId || 'm1';

            this.extraConfigs.datapointsToAlarm =
                extraConfigs.datapointsToAlarm ||
                extraConfigs.evaluationPeriods ||
                constants.ANOMALY_DETECTION_DATAPOINTS;
            this.extraConfigs.evaluationPeriods =
                extraConfigs.evaluationPeriods || constants.ANOMALY_DETECTION_DATAPOINTS;
            this.metricArgs.thresholdMetricId = expressionId;

            this.metricQueries.push({
                id: expressionId,
                expression: `ANOMALY_DETECTION_BAND(${metricToWatchId}, ${standardDeviation})`,
                label: `${alarmConfig.metricName} (Expected)`,
                returnData: true,
            });

            this.setComparisonOperator(anomalyDetectionConfig.anomalyComparison);
        }
    }
}
