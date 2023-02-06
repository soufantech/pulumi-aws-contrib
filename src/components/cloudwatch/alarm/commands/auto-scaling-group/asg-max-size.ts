import * as pulumi from '@pulumi/pulumi';

import { NonAnomalyDetectionAlarmExtraConfigs, AsgConfig } from '../../../types';
import { AlarmBuilder } from '../../alarm-builder';
import { AlarmStore } from '../../alarm-store';
import { CreateAlarmCommand } from '../../create-alarm-command';

export class AsgMaxSize extends CreateAlarmCommand {
    constructor(
        readonly name: string,
        readonly threshold: pulumi.Input<number>,
        readonly configs: AsgConfig,
        readonly extraConfigs?: NonAnomalyDetectionAlarmExtraConfigs
    ) {
        super();
    }

    execute(parent?: AlarmStore) {
        const { asgName } = this.configs;

        const comparisonOperator = 'GreaterThanOrEqualToThreshold';
        const logicalName = `${this.name}-asg-max-size`;
        const namespace = 'AWS/AutoScaling';
        const stat = 'Maximum';
        const dimensions = { AutoScalingGroupName: asgName };

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
                metricName: 'GroupInServiceInstances',
                namespace,
                period: this.extraConfigs?.period,
                returnData: false,
            })
            .addMetric({
                id: 'm2',
                namespace,
                metricName: 'GroupMaxSize',
                dimensions,
                stat,
                period: this.extraConfigs?.period,
                returnData: false,
            })
            .addExpression({
                id: 'e1',
                expression: '(m1*100)/m2',
                label: 'AsgMaxSize',
                returnData: true,
            });

        return alarmBuilder.build();
    }
}
