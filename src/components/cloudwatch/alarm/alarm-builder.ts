import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import * as constants from '../constants';

type AddMetricDto = {
    id: pulumi.Input<string>;
    stat: pulumi.Input<string>;
    metricName: pulumi.Input<string>;
    namespace: pulumi.Input<string>;
    period?: pulumi.Input<number>;
    returnData: pulumi.Input<boolean>;
    dimensions: Record<string, pulumi.Input<string>>;
};

type AddExpressionDto = {
    id: pulumi.Input<string>;
    expression: pulumi.Input<string>;
    label: pulumi.Input<string>;
    returnData: pulumi.Input<boolean>;
};

type AnomalyDetectionDto = {
    thresholdMetricId: pulumi.Input<string>;
    metricToWatchId: pulumi.Input<string>;
    standardDeviation?: pulumi.Input<number>;
    anomalyComparison: pulumi.Input<string>;
    label: pulumi.Input<string>;
};

export class AlarmBuilder {
    private args: Partial<aws.cloudwatch.MetricAlarmArgs>;

    private metricQueries: pulumi.Input<aws.types.input.cloudwatch.MetricAlarmMetricQuery>[];

    private isAnomaly: boolean;

    private isShort: boolean;

    private alarmName: string;

    private anomalyArgs?: AnomalyDetectionDto;

    private parent?: pulumi.Resource;

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

    comparisonOperator(comparisonOperator: pulumi.Input<string>) {
        this.args.comparisonOperator = comparisonOperator;
        return this;
    }

    evaluationPeriods(evaluationPeriods?: pulumi.Input<number>) {
        this.args.evaluationPeriods = evaluationPeriods;
        return this;
    }

    dataPointsToAlarm(dataPointsToAlarm?: pulumi.Input<number>) {
        this.args.datapointsToAlarm = dataPointsToAlarm;
        return this;
    }

    setParent(parent?: pulumi.Resource) {
        this.parent = parent;
        return this;
    }

    treatMissingData(treatMissingData?: pulumi.Input<string>) {
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
                period: metric.period || 0,
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

    addDescription(description: pulumi.Input<string>) {
        this.args.alarmDescription = description;
        return this;
    }

    threshold(threshold: pulumi.Input<number>) {
        this.args.threshold = threshold;
        return this;
    }

    thresholdMetricId(id: pulumi.Input<string>) {
        this.args.thresholdMetricId = id;
        return this;
    }

    anomalyDetection(custom: AnomalyDetectionDto) {
        this.isAnomaly = true;
        this.anomalyArgs = custom;
        return this;
    }

    snsTopicArns(snsTopicArns?: pulumi.Input<string>[]) {
        this.args.alarmActions = snsTopicArns;
        this.args.okActions = snsTopicArns;
        return this;
    }

    private setAnomalyDetection() {
        if (!this.anomalyArgs) return this;

        this.comparisonOperator(this.anomalyArgs.anomalyComparison);

        delete this.args.threshold;
        this.thresholdMetricId(this.anomalyArgs.thresholdMetricId);

        const standardDeviation =
            this.anomalyArgs.standardDeviation || constants.STANDARD_DEVIATION;
        this.addExpression({
            id: this.anomalyArgs.thresholdMetricId,
            expression: `ANOMALY_DETECTION_BAND(${this.anomalyArgs.metricToWatchId}, ${standardDeviation})`,
            label: `${this.anomalyArgs.label} (Expected)`,
            returnData: true,
        });

        return this;
    }

    private ensurePeriodInMetrics() {
        this.metricQueries = this.metricQueries.map((metricQueryInput) => {
            return pulumi.all([metricQueryInput]).apply(([metricQuery]) => {
                const { metric } = metricQuery;

                if (!metric) return pulumi.output(metricQuery);

                return pulumi.output(metric.period).apply((period) => {
                    if (period > 0) return metricQuery;

                    return {
                        ...metricQuery,
                        metric: {
                            ...metric,
                            period: this.isShort ? constants.SHORT_PERIOD : constants.LONG_PERIOD,
                        },
                    };
                });
            });
        });
    }

    build() {
        if (!this.args.comparisonOperator)
            throw new Error('Alarm is missing required property: comparison operator');
        if (!this.alarmName) throw new Error('Alarm is missing required property: name');
        if (!this.metricQueries.length)
            throw new Error('Alarm must contain at list one metric query');

        this.ensurePeriodInMetrics();

        const evaluationPeriods =
            this.args.evaluationPeriods ||
            (this.isAnomaly ? constants.ANOMALY_DETECTION_DATAPOINTS : constants.DATAPOINTS);
        const datapointsToAlarm = this.args.datapointsToAlarm || evaluationPeriods;
        const treatMissingData = this.args.treatMissingData || constants.TREAT_MISSING_DATA;

        if (this.isAnomaly) {
            this.setAnomalyDetection();
        }

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
