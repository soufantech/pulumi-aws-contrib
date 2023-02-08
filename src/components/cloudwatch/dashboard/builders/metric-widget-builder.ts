import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import {
    Widget,
    MetricWidget,
    SingleHorizontalAnnotation,
    BandedHorizontalAnnotation,
    SingleVerticalAnnotation,
    BandedVerticalAnnotation,
} from '../../types';
import { WidgetBuilder } from './widget-builder';

export type MetricWidgetBuilderArgs = {
    region?: MetricWidget['properties']['region'];
};

export class MetricWidgetBuilder extends WidgetBuilder {
    private properties: MetricWidget['properties'];

    constructor(args?: MetricWidgetBuilderArgs) {
        super({ type: 'metric', properties: {} });
        this.properties = {
            region: args?.region ?? aws.getRegionOutput().name,
            metrics: [],
        };
    }

    accountId(accountId: MetricWidget['properties']['accountId']) {
        this.properties.accountId = accountId;
        return this;
    }

    addAlarmAnnotations(annotation: pulumi.Input<string>) {
        if (!this.properties.annotations) {
            this.properties.annotations = {};
        }

        if (this.properties.annotations.horizontal) {
            throw new Error('Cannot add alarm annotations when horizontal annotations exist');
        }
        if (this.properties.annotations.vertical) {
            throw new Error('Cannot add alarm annotations when vertical annotations exist');
        }

        if (!this.properties.annotations.alarms) {
            this.properties.annotations.alarms = [];
        }

        this.properties.annotations.alarms.push(annotation);

        return this;
    }

    addHorizontalAnnotation(annotation: SingleHorizontalAnnotation | BandedHorizontalAnnotation) {
        if (!this.properties.annotations) {
            this.properties.annotations = {};
        }

        if (this.properties.annotations.alarms) {
            throw new Error('Cannot add horizontal annotations when alarm annotations exist');
        }

        if (!this.properties.annotations.horizontal) {
            this.properties.annotations.horizontal = [];
        }

        this.properties.annotations.horizontal.push(annotation);

        return this;
    }

    addVerticalAnnotation(annotation: SingleVerticalAnnotation | BandedVerticalAnnotation) {
        if (!this.properties.annotations) {
            this.properties.annotations = {};
        }

        if (this.properties.annotations.alarms) {
            throw new Error('Cannot add vertical annotations when alarm annotations exist');
        }

        if (!this.properties.annotations.vertical) {
            this.properties.annotations.vertical = [];
        }

        this.properties.annotations.vertical.push(annotation);

        return this;
    }

    liveData(liveData: MetricWidget['properties']['liveData']) {
        this.properties.liveData = liveData;
        return this;
    }

    legend(position: pulumi.Input<'hidden' | 'bottom' | 'right'>) {
        this.properties.legend = { position };
        return this;
    }

    period(period: MetricWidget['properties']['period']) {
        pulumi.output(period).apply((p) => {
            if (p && p % 60 !== 0) {
                throw new Error('Period must be a multiple of 60');
            }
            if (p && p < 60) {
                throw new Error('Period must be at least 60');
            }
        });

        this.properties.period = period;
        return this;
    }

    region(region: MetricWidget['properties']['region']) {
        this.properties.region = region;
        return this;
    }

    sparkline(sparkline: MetricWidget['properties']['sparkline']) {
        this.properties.sparkline = sparkline;
        return this;
    }

    stacked(stacked: MetricWidget['properties']['stacked']) {
        this.properties.stacked = stacked;
        return this;
    }

    stat(stat: MetricWidget['properties']['stat']) {
        pulumi.output(stat).apply((s) => {
            if (s && s.startsWith('p')) {
                const percentile = parseInt(s.substring(1), 10);
                if (percentile < 0 || percentile > 100) {
                    throw new Error('Percentile must be between 0 and 100');
                }
            }
            const validStats = ['Average', 'Maximum', 'Minimum', 'SampleCount', 'Sum'];
            if (s && !validStats.includes(s)) {
                throw new Error(`Stat must be one of ${validStats.join(', ')}`);
            }
        });

        this.properties.stat = stat;
        return this;
    }

    timezone(timezone: MetricWidget['properties']['timezone']) {
        this.properties.timezone = timezone;
        return this;
    }

    title(title: MetricWidget['properties']['title']) {
        this.properties.title = title;
        return this;
    }

    view(view: MetricWidget['properties']['view']) {
        this.properties.view = view;
        return this;
    }

    yAxis(yAxis: MetricWidget['properties']['yAxis']) {
        this.properties.yAxis = yAxis;
        return this;
    }

    addMetric(metric: MetricWidget['properties']['metrics'][number]) {
        this.properties.metrics.push(metric);
        return this;
    }

    build(): pulumi.Output<Widget> {
        if (this.properties.metrics.length === 0) {
            throw new Error('Must have at least one metric');
        }

        pulumi.output(this.properties.view).apply((v) => {
            if (v === 'gauge' && !this.properties.yAxis) {
                throw new Error('yAxis must be set when view is gauge');
            }
        });

        const widget: Widget = {
            ...this.widgetAttributes,
            properties: this.properties,
        };

        return pulumi.all(widget as Record<string, any>) as pulumi.Output<Widget>;
    }
}
