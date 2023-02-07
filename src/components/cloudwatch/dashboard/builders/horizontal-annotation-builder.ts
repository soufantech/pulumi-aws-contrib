import * as pulumi from '@pulumi/pulumi';

import type {
    HorizontalAnnotation,
    HorizontalBandAnnotation,
    SingleHorizontalAnnotation,
    BandedHorizontalAnnotation,
} from '../../types';

export type HorizontalAnnotationBuilderArgs = {
    value: HorizontalAnnotation['value'];
};

export class HorizontalAnnotationBuilder {
    private annotation: HorizontalAnnotation;

    private bandAnnotation?: HorizontalBandAnnotation;

    constructor(args: HorizontalAnnotationBuilderArgs) {
        this.annotation = {
            value: args.value,
        };
    }

    value(value: HorizontalAnnotation['value']) {
        this.annotation.value = value;
        return this;
    }

    label(label: HorizontalAnnotation['label']) {
        this.annotation.label = label;
        return this;
    }

    color(color: HorizontalAnnotation['color']) {
        pulumi.output(color).apply((c) => {
            if (c && !c.startsWith('#')) {
                throw new Error('Color must be a hexadecimal (e.g. #d62728)');
            }
        });

        this.annotation.color = color;
        return this;
    }

    visible(visible: HorizontalAnnotation['visible']) {
        this.annotation.visible = visible;
        return this;
    }

    yAxis(yAxis: HorizontalAnnotation['yAxis']) {
        this.annotation.yAxis = yAxis;
        return this;
    }

    fill(fill: HorizontalAnnotation['fill']) {
        this.annotation.fill = fill;
        return this;
    }

    band(value: HorizontalBandAnnotation['value'], label?: HorizontalBandAnnotation['label']) {
        this.bandAnnotation = { value, label };
        return this;
    }

    build(): SingleHorizontalAnnotation | BandedHorizontalAnnotation {
        if (this.bandAnnotation) {
            return [{ ...this.annotation }, { ...this.bandAnnotation }];
        }
        return { ...this.annotation };
    }
}
