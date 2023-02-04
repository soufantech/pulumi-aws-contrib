import { AlarmBuilder } from '../../alarm-builder';
import { AlarmStore } from '../../alarm-store';
import { NonAnomalyDetectionAlarmExtraConfigs, TargetGroupConfig } from '../../../types';
import { CreateAlarmCommand } from '../../create-alarm-command';

export class CreateUptimeAlarmCommand extends CreateAlarmCommand {
    constructor(
        readonly name: string,
        readonly threshold: number,
        readonly configs: TargetGroupConfig,
        readonly extraConfigs?: NonAnomalyDetectionAlarmExtraConfigs
    ) {
        super();
    }

    execute(parent?: AlarmStore) {
        const { loadBalancer, targetGroup } = this.configs;

        const comparisonOperator = 'LessThanOrEqualToThreshold';
        const logicalName = `${this.name}-uptime`;
        const namespace = 'AWS/ApplicationELB';
        const stat = 'Sum';
        const dimensions = { LoadBalancer: loadBalancer, TargetGroup: targetGroup };

        const alarmBuilder = new AlarmBuilder()
            .name(logicalName, this.extraConfigs?.suffix)
            .threshold(this.threshold)
            .shortPeriod()
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
                metricName: 'RequestCount',
                namespace,
                period: this.extraConfigs?.period,
                returnData: false,
            })
            .addMetric({
                id: 'm2',
                namespace,
                metricName: 'HTTPCode_ELB_5XX_Count',
                dimensions,
                stat,
                period: this.extraConfigs?.period,
                returnData: false,
            })
            .addExpression({
                id: 'e1',
                expression: '(1-(m2/m1))*100',
                label: 'Uptime',
                returnData: true,
            });

        return alarmBuilder.build();
    }
}
