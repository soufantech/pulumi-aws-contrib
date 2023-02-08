import type { MetricExpression } from '../../types';

export type ExpressionBuilderArgs = {
    expression: MetricExpression['expression'];
};

export class ExpressionBuilder {
    private metricExpression: MetricExpression;

    constructor(args: ExpressionBuilderArgs) {
        this.metricExpression = { expression: args.expression };
    }

    label(label: MetricExpression['label']) {
        this.metricExpression.label = label;
        return this;
    }

    id(id: MetricExpression['id']) {
        this.metricExpression.id = id;
        return this;
    }

    region(region: MetricExpression['region']) {
        this.metricExpression.region = region;
        return this;
    }

    build(): MetricExpression[] {
        return [{ ...this.metricExpression }];
    }
}
