import * as aws from '@pulumi/aws';

import * as constants from '../constants';
import { AlarmExtraConfigs } from '../types';

interface AlarmConfig {
    metricName: string;
    namespace: string;
    statistics: string;
    dimensions: Record<string, string>;
    comparisonOperator: string;
}

export default abstract class Alarm {
    period: number;

    datapointsToAlarm!: number;

    treatMissingData: string;

    standardDeviation: number;

    parent: AlarmExtraConfigs['parent'];

    metricQueries: aws.types.input.cloudwatch.MetricAlarmMetricQuery[];

    metricArgs: Partial<aws.cloudwatch.MetricAlarmArgs>;

    evaluationPeriods!: number;

    snsTopicArns: string[] | undefined;

    setDataPointsAndEvalPeriod(extraConfigs: AlarmExtraConfigs, defaultValue: number) {
        this.datapointsToAlarm =
            extraConfigs.datapointsToAlarm || extraConfigs.evaluationPeriods || defaultValue;
        this.evaluationPeriods = extraConfigs.evaluationPeriods || defaultValue;
    }

    setComparisonOperator(operator: string) {
        this.alarmConfig.comparisonOperator = operator;
    }

    constructor(
        protected name: string,
        threshold: number,
        protected alarmConfig: AlarmConfig,
        extraConfigs: AlarmExtraConfigs = {}
    ) {
        this.period = extraConfigs.period || constants.LONG_PERIOD;
        this.treatMissingData = extraConfigs.treatMissingData || constants.TREAT_MISSING_DATA;
        this.standardDeviation = extraConfigs.standardDeviation || constants.STANDARD_DEVIATION;
        this.parent = extraConfigs.parent;

        this.setDataPointsAndEvalPeriod(extraConfigs, constants.DATAPOINTS);

        this.metricQueries = [];
        this.metricArgs = {};
        this.metricArgs.threshold = threshold;

        this.snsTopicArns = extraConfigs.snsTopicArns;
    }

    getValue() {
        return new aws.cloudwatch.MetricAlarm(
            this.name,
            {
                comparisonOperator: this.alarmConfig.comparisonOperator,
                evaluationPeriods: this.evaluationPeriods,
                datapointsToAlarm: this.datapointsToAlarm,
                treatMissingData: this.treatMissingData,
                metricQueries: [
                    ...this.metricQueries,
                    {
                        id: 'm1',
                        label: this.alarmConfig.metricName,
                        metric: {
                            namespace: this.alarmConfig.namespace,
                            metricName: this.alarmConfig.metricName,
                            dimensions: this.alarmConfig.dimensions,
                            stat: this.alarmConfig.statistics,
                            period: this.period,
                        },
                        returnData: true,
                    },
                ],
                alarmActions: this.snsTopicArns,
                okActions: this.snsTopicArns,
                ...this.metricArgs,
            },
            {
                parent: this.parent,
            }
        );
    }
}
