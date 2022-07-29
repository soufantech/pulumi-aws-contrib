import * as constants from '../constants';
import { AlarmExtraConfigs } from '../types';
import Alarm from './alarm';

export default class AlarmWithAnomalyDetection extends Alarm {
    hasAnomalyDetection: boolean;

    constructor(
        name: string,
        threshold: number,
        alarmConfig: Alarm['alarmConfig'],
        extraConfigs: AlarmExtraConfigs
    ) {
        super(name, threshold, alarmConfig, extraConfigs);
        this.hasAnomalyDetection = threshold === 0;

        if (this.hasAnomalyDetection) {
            delete this.metricArgs.threshold;
            this.extraConfigs.standardDeviation =
                extraConfigs.standardDeviation || constants.STANDARD_DEVIATION;
            this.extraConfigs.datapointsToAlarm =
                extraConfigs.datapointsToAlarm ||
                extraConfigs.evaluationPeriods ||
                constants.ANOMALY_DETECTION_DATAPOINTS;
            this.extraConfigs.evaluationPeriods =
                extraConfigs.evaluationPeriods || constants.ANOMALY_DETECTION_DATAPOINTS;
            this.metricArgs.thresholdMetricId = 'e1';
            this.metricQueries.push({
                id: 'e1',
                expression: `ANOMALY_DETECTION_BAND(m1, ${this.extraConfigs.standardDeviation})`,
                label: `${alarmConfig.metricName} (Expected)`,
                returnData: true,
            });
            this.setComparisonOperator('GreaterThanUpperThreshold');
        }
    }
}
