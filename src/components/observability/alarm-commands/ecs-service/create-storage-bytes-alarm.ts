import AlarmBuilder from '../../builders/alarm-builder';
import { CreateAlarmCommand } from '../../commands/create-alarm-command';
import AlarmStore from '../../resources/alarm-store';
import { AlarmExtraConfigs, EcsServiceConfig } from '../../types';

export default class CreateStorageBytesAlarmCommand implements CreateAlarmCommand {
    // eslint-disable-next-line no-useless-constructor
    constructor(
        readonly name: string,
        readonly threshold: number,
        readonly configs: EcsServiceConfig,
        readonly extraConfigs: AlarmExtraConfigs = {},
        readonly input: 'write' | 'read'
    ) { }

    execute(parent?: AlarmStore) {
        const { clusterName, serviceName } = this.configs;

        const logicalName = `${this.name}-storage-${this.input}-bytes`;

        const comparisonOperator = 'GreaterThanOrEqualToThreshold';
        const anomalyDetectionComparisonOperator = 'GreaterThanUpperThreshold';
        const namespace = 'ECS/ContainerInsights';
        const metricName = this.input === 'write' ? 'StorageWriteBytes' : 'StorageReadBytes';
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
