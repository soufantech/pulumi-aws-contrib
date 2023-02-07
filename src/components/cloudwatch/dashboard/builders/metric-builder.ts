import * as pulumi from '@pulumi/pulumi';

import type { RenderingProperties, SingleMetric } from '../../types';

export type MetricBuilderArgs = {
    namespace: pulumi.Input<string>;
    metricName: pulumi.Input<string>;
    dimensions?: Record<string, pulumi.Input<string>>;
};

export class MetricBuilder {
    private metricProperties: pulumi.Input<string>[];

    private renderingProperties: RenderingProperties = {};

    constructor(args: MetricBuilderArgs) {
        const dimensions = Object.entries(args.dimensions || {}).flat();
        this.metricProperties = [args.namespace, args.metricName, ...dimensions];
    }

    color(color: pulumi.Input<string>) {
        pulumi.output(color).apply((c) => {
            if (c && !c.startsWith('#')) {
                throw new Error('Color must be a hexadecimal (e.g. #d62728)');
            }
        });

        this.renderingProperties.color = color;
        return this;
    }

    label(label: pulumi.Input<string>) {
        this.renderingProperties.label = label;
        return this;
    }

    id(id: pulumi.Input<string>) {
        this.renderingProperties.id = id;
        return this;
    }

    period(period: pulumi.Input<number>) {
        pulumi.output(period).apply((p) => {
            if (p && p % 60 !== 0) {
                throw new Error('Period must be a multiple of 60');
            }
            if (p && p < 60) {
                throw new Error('Period must be at least 60');
            }
        });

        this.renderingProperties.period = period;
        return this;
    }

    region(region: pulumi.Input<string>) {
        this.renderingProperties.region = region;
        return this;
    }

    stat(stat: pulumi.Input<string>) {
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

        this.renderingProperties.stat = stat;
        return this;
    }

    visible(visible: pulumi.Input<boolean>) {
        this.renderingProperties.visible = visible;
        return this;
    }

    yAxis(yAxis: pulumi.Input<'left' | 'right'>) {
        this.renderingProperties.yAxis = yAxis;
        return this;
    }

    build(): SingleMetric {
        return [...this.metricProperties, { ...this.renderingProperties }];
    }
}
