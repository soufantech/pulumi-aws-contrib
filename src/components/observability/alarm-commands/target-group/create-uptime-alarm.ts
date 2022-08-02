import { Resource } from '@pulumi/pulumi';

import AlarmBuilder from '../../builders/alarm-builder';
import { CreateAlarmCommand } from '../../commands/create-alarm-command';
import { TargetGroupConfig, AlarmExtraConfigs } from '../../types';

export default class CreateUptimeAlarmCommand implements CreateAlarmCommand {
    // eslint-disable-next-line no-useless-constructor
    constructor(
        readonly name: string,
        readonly threshold: number,
        readonly configs: TargetGroupConfig,
        readonly extraConfigs?: AlarmExtraConfigs
    ) { }

    execute(parent?: Resource) {
        const { loadBalancer, targetGroup } = this.configs;

        const logicalName = `${this.name}-uptime`;
        const namespace = 'AWS/ApplicationELB';
        const stat = 'Sum';
        const dimensions = { LoadBalancer: loadBalancer, TargetGroup: targetGroup };

        const alarmBuilder = new AlarmBuilder()
            .name(logicalName, this.extraConfigs?.suffix)
            .short()
            .comparisonOperator('LessThanOrEqualToThreshold')
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
                returnData: false,
            })
            .addMetric({
                id: 'm2',
                namespace,
                metricName: 'HTTPCode_ELB_5XX_Count',
                dimensions,
                stat,
                returnData: false,
            })
            .addExpression({
                id: 'e1',
                expression: '(1-(m2/m1))*100',
                label: 'Uptime',
                returnData: true,
            });

        if (this.threshold === 0) {
            alarmBuilder.anomalyDetection({
                thresholdMetricId: 'e2',
                anomalyComparison: 'LessThanLowerThreshold',
                metricToWatchId: 'e1',
                label: 'Uptime',
            });
        }

        return alarmBuilder.build();
    }
}
