import * as pulumi from '@pulumi/pulumi';

import { AlarmExtraConfigs, EcsServiceConfig } from '../../../types';
import { AlarmBuilder } from '../../alarm-builder';
import { AlarmStore } from '../../alarm-store';
import { CreateAlarmCommand } from '../../create-alarm-command';

export class StorageBytes extends CreateAlarmCommand {
    constructor(
        readonly name: string,
        readonly threshold: pulumi.Input<number>,
        readonly configs: EcsServiceConfig,
        readonly extraConfigs: AlarmExtraConfigs,
        readonly input: 'write' | 'read'
    ) {
        super();
    }

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
