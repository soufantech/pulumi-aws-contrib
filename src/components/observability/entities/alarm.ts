import * as aws from '@pulumi/aws';

import * as constants from '../constants';
import { AlarmExtraConfigs } from '../types';

interface AlarmConfig {
    metricName: string;
    isShortPeriod: boolean;
    namespace: string;
    statistics: string;
    dimensions: Record<string, string>;
    comparisonOperator: string;
}

export default abstract class Alarm {
    metricQueries: aws.types.input.cloudwatch.MetricAlarmMetricQuery[];

    metricArgs: Partial<aws.cloudwatch.MetricAlarmArgs>;

    extraConfigs: Required<
        Omit<AlarmExtraConfigs, 'parent' | 'snsTopicArns' | 'standardDeviation'>
    > &
        Pick<AlarmExtraConfigs, 'snsTopicArns' | 'parent'>;

    setComparisonOperator(operator: string) {
        this.alarmConfig.comparisonOperator = operator;
    }

    constructor(
        protected name: string,
        threshold: number,
        protected alarmConfig: AlarmConfig,
        extraConfigs: AlarmExtraConfigs = {}
    ) {
        this.extraConfigs = {
            period:
                extraConfigs.period ||
                (this.alarmConfig.isShortPeriod ? constants.SHORT_PERIOD : constants.LONG_PERIOD),
            treatMissingData: extraConfigs.treatMissingData || constants.TREAT_MISSING_DATA,
            snsTopicArns: extraConfigs.snsTopicArns,
            parent: extraConfigs.parent,
            datapointsToAlarm:
                extraConfigs.datapointsToAlarm ||
                extraConfigs.evaluationPeriods ||
                constants.DATAPOINTS,
            evaluationPeriods: extraConfigs.evaluationPeriods || constants.DATAPOINTS,
        };

        this.metricQueries = [
            {
                id: 'm1',
                label: this.alarmConfig.metricName,
                metric: {
                    namespace: this.alarmConfig.namespace,
                    metricName: this.alarmConfig.metricName,
                    dimensions: this.alarmConfig.dimensions,
                    stat: this.alarmConfig.statistics,
                    period: this.extraConfigs.period,
                },
                returnData: true,
            },
        ];
        this.metricArgs = {};
        this.metricArgs.threshold = threshold;
    }

    getValue() {
        return new aws.cloudwatch.MetricAlarm(
            this.name,
            {
                comparisonOperator: this.alarmConfig.comparisonOperator,
                evaluationPeriods: this.extraConfigs.evaluationPeriods,
                datapointsToAlarm: this.extraConfigs.datapointsToAlarm,
                treatMissingData: this.extraConfigs.treatMissingData,
                metricQueries: this.metricQueries,
                alarmActions: this.extraConfigs.snsTopicArns,
                okActions: this.extraConfigs.snsTopicArns,
                ...this.metricArgs,
            },
            {
                parent: this.extraConfigs.parent,
            }
        );
    }
}
