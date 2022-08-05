import * as aws from '@pulumi/aws';
import { Resource } from '@pulumi/pulumi';

import * as constants from '../constants';

type AddMetricDto = {
    id: string;
    stat: string;
    metricName: string;
    namespace: string;
    period?: number;
    returnData: boolean;
    dimensions: Record<string, string>;
};

type AddExpressionDto = {
    id: string;
    expression: string;
    label: string;
    returnData: boolean;
};

type AnomalyDetectionDto = {
    thresholdMetricId: string;
    metricToWatchId: string;
    standardDeviation?: number;
    anomalyComparison: string;
    label: string;
};

export default class AlarmBuilder {
    private args: Partial<aws.cloudwatch.MetricAlarmArgs>;

    private metricQueries: aws.types.input.cloudwatch.MetricAlarmMetricQuery[];

    private isAnomaly: boolean;

    private isShort: boolean;

    private alarmName: string;

    private parent?: Resource;

    constructor() {
        this.args = {};
        this.alarmName = '';
        this.isShort = false;
        this.isAnomaly = false;
        this.metricQueries = [];
    }

    name(name: string, suffix?: string) {
        this.alarmName = suffix ? `${name}-${suffix}` : name;
        return this;
    }

    shortPeriod() {
        this.isShort = true;
        return this;
    }

    comparisonOperator(comparisonOperator: string) {
        this.args.comparisonOperator = comparisonOperator;
        return this;
    }

    evaluationPeriods(evaluationPeriods?: number) {
        this.args.evaluationPeriods = evaluationPeriods;
        return this;
    }

    dataPointsToAlarm(dataPointsToAlarm?: number) {
        this.args.datapointsToAlarm = dataPointsToAlarm;
        return this;
    }

    setParent(parent?: Resource) {
        this.parent = parent;
        return this;
    }

    treatMissingData(treatMissingData?: string) {
        this.args.treatMissingData = treatMissingData;
        return this;
    }

    addMetric(metric: AddMetricDto) {
        this.metricQueries.push({
            id: metric.id,
            label: metric.metricName,
            metric: {
                metricName: metric.metricName,
                namespace: metric.namespace,
                stat: metric.stat,
                period:
                    metric.period ||
                    (this.isShort ? constants.SHORT_PERIOD : constants.LONG_PERIOD),
                dimensions: metric.dimensions,
            },
            returnData: metric.returnData,
        });
        return this;
    }

    addExpression(metric: AddExpressionDto) {
        this.metricQueries.push({
            id: metric.id,
            label: metric.label,
            expression: metric.expression,
            returnData: metric.returnData,
        });
        return this;
    }

    threshold(threshold: number) {
        this.args.threshold = threshold;
        return this;
    }

    thresholdMetricId(id: string) {
        this.args.thresholdMetricId = id;
        return this;
    }

    setAnomalyDetection(custom: AnomalyDetectionDto) {
        this.isAnomaly = true;
        delete this.args.threshold;
        this.thresholdMetricId(custom.thresholdMetricId);
        this.comparisonOperator(custom.anomalyComparison);
        const standardDeviation = custom.standardDeviation || constants.STANDARD_DEVIATION;
        this.addExpression({
            id: custom.thresholdMetricId,
            expression: `ANOMALY_DETECTION_BAND(${custom.metricToWatchId}, ${standardDeviation})`,
            label: `${custom.label} (Expected)`,
            returnData: true,
        });
        return this;
    }

    snsTopicArns(snsTopicArns?: string[]) {
        this.args.alarmActions = snsTopicArns;
        this.args.okActions = snsTopicArns;
        return this;
    }

    build() {
        if (!this.args.comparisonOperator) throw new Error('Missing comparison operator');
        if (!this.alarmName) throw new Error('Missing alarm name');
        if (!this.metricQueries.length) throw new Error('Missing metrics');

        const evaluationPeriods =
            this.args.evaluationPeriods ||
            (this.isAnomaly ? constants.ANOMALY_DETECTION_DATAPOINTS : constants.DATAPOINTS);
        const datapointsToAlarm = this.args.datapointsToAlarm || evaluationPeriods;
        const treatMissingData = this.args.treatMissingData || constants.TREAT_MISSING_DATA;

        return new aws.cloudwatch.MetricAlarm(
            this.alarmName,
            {
                ...this.args,
                comparisonOperator: this.args.comparisonOperator,
                datapointsToAlarm,
                evaluationPeriods,
                treatMissingData,
                metricQueries: this.metricQueries,
            },
            {
                parent: this.parent,
            }
        );
    }
}
