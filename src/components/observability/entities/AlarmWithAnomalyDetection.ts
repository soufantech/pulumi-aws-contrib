import * as constants from '../constants';
import { AlarmExtraConfigs } from '../types';
import Alarm from './Alarm';

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
            const standardDeviation =
                extraConfigs?.standardDeviation || constants.STANDARD_DEVIATION;
            this.setDataPointsAndEvalPeriod(extraConfigs, constants.ANOMALY_DETECTION_DATAPOINTS);
            delete this.metricArgs.threshold;
            this.metricArgs.thresholdMetricId = 'e1';
            this.metricQueries.push({
                id: 'e1',
                expression: `ANOMALY_DETECTION_BAND(m1, ${standardDeviation})`,
                label: `${alarmConfig.metricName} (Expected)`,
                returnData: true,
            });
        }
    }
}
