import * as pulumi from '@pulumi/pulumi';

import { AlarmExtraConfigs, RdsConfig } from '../../../types';
import { AlarmBuilder } from '../../alarm-builder';
import { AlarmStore } from '../../alarm-store';
import { CreateAlarmCommand } from '../../create-alarm-command';

export class DatabaseConnections extends CreateAlarmCommand {
    constructor(
        readonly name: string,
        readonly threshold: pulumi.Input<number>,
        readonly configs: RdsConfig,
        readonly extraConfigs?: AlarmExtraConfigs
    ) {
        super();
    }

    execute(parent?: AlarmStore) {
        const { dbInstanceIdentifier } = this.configs;

        const logicalName = `${this.name}-database-connections`;

        const comparisonOperator = 'GreaterThanOrEqualToThreshold';
        const anomalyDetectionComparisonOperator = 'GreaterThanUpperThreshold';
        const namespace = 'AWS/RDS';
        const metricName = 'DatabaseConnections';
        const stat = 'Average';
        const dimensions = { DBInstanceIdentifier: dbInstanceIdentifier };
        const description =
            this.threshold === 0
                ? `Alert if ${metricName} of ${dbInstanceIdentifier} has some unexpected behavior for the anomaly detection model`
                : `Alert if ${metricName} of ${dbInstanceIdentifier} is greater than or equal to ${this.threshold} for ${this.extraConfigs?.datapointsToAlarm} datapoint(s) within ${this.extraConfigs?.evaluationPeriods} period(s) of ${this.extraConfigs?.period} seconds.`;

        const alarmBuilder = new AlarmBuilder()
            .name(logicalName, this.extraConfigs?.suffix)
            .addDescription(description)
            .threshold(this.threshold)
            .comparisonOperator(comparisonOperator)
            .evaluationPeriods(this.extraConfigs?.evaluationPeriods)
            .dataPointsToAlarm(this.extraConfigs?.datapointsToAlarm)
            .treatMissingData(this.extraConfigs?.treatMissingData)
            .snsTopicArns(this.extraConfigs?.snsTopicArns)
            .setParent(parent)
            .addMetric({
                id: 'm1',
                stat,
                dimensions,
                metricName,
                namespace,
                period: this.extraConfigs?.period,
                returnData: true,
            });

        if (this.threshold === 0) {
            alarmBuilder.anomalyDetection({
                thresholdMetricId: 'e1',
                anomalyComparison: anomalyDetectionComparisonOperator,
                metricToWatchId: 'm1',
                label: metricName,
            });
        }

        return alarmBuilder.build();
    }
}
