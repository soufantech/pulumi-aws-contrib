import AlarmBuilder from '../../builders/alarm-builder';
import { CreateAlarmCommand } from '../../commands/create-alarm-command';
import AlarmStore from '../../resources/alarm-store';
import { AlarmExtraConfigs, EcsServiceConfig } from '../../types';

export default class CreateRequestCountAlarmCommand implements CreateAlarmCommand {
    // eslint-disable-next-line no-useless-constructor
    constructor(
        readonly name: string,
        readonly threshold: number,
        readonly configs: EcsServiceConfig,
        readonly extraConfigs?: AlarmExtraConfigs
    ) { }

    execute(parent?: AlarmStore) {
        const { clusterName, serviceName } = this.configs;

        const logicalName = `${this.name}-cpu-utilization`;

        const comparisonOperator = 'GreaterThanOrEqualToThreshold';
        const anomalyDetectionComparisonOperator = 'GreaterThanUpperThreshold';
        const namespace = 'AWS/ECS';
        const metricName = 'CPUUtilization';
        const stat = 'Average';
        const dimensions = { ClusterName: clusterName, ServiceName: serviceName };

        const alarmBuilder = new AlarmBuilder()
            .name(logicalName, this.extraConfigs?.suffix)
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
            alarmBuilder.hasAnomalyDetection({
                thresholdMetricId: 'e1',
                anomalyComparison: anomalyDetectionComparisonOperator,
                metricToWatchId: 'm1',
                label: metricName,
            });
        }

        return alarmBuilder.build();
    }
}
