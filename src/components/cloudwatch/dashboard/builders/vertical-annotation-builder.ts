import * as pulumi from '@pulumi/pulumi';

import type {
    VerticalAnnotation,
    VerticalBandAnnotation,
    SingleVerticalAnnotation,
    BandedVerticalAnnotation,
} from '../../types';

export type VerticalAnnotationBuilderArgs = {
    value: VerticalAnnotation['value'];
};

export class VerticalAnnotationBuilder {
    private annotation: VerticalAnnotation;

    private bandAnnotation?: VerticalBandAnnotation;

    constructor(args: VerticalAnnotationBuilderArgs) {
        this.annotation = {
            value: args.value,
        };
    }

    value(value: VerticalAnnotation['value']) {
        this.annotation.value = value;
        return this;
    }

    label(label: VerticalAnnotation['label']) {
        this.annotation.label = label;
        return this;
    }

    color(color: VerticalAnnotation['color']) {
        pulumi.output(color).apply((c) => {
            if (c && !c.startsWith('#')) {
                throw new Error('Color must be a hexadecimal (e.g. #d62728)');
            }
        });

        this.annotation.color = color;
        return this;
    }

    visible(visible: VerticalAnnotation['visible']) {
        this.annotation.visible = visible;
        return this;
    }

    fill(fill: VerticalAnnotation['fill']) {
        this.annotation.fill = fill;
        return this;
    }

    band(value: VerticalBandAnnotation['value'], label?: VerticalBandAnnotation['label']) {
        this.bandAnnotation = { value, label };
        return this;
    }

    build(): SingleVerticalAnnotation | BandedVerticalAnnotation {
        if (!this.annotation.value) {
            throw new Error('Annotation value must be provided');
        }

        if (this.bandAnnotation && !this.bandAnnotation.value) {
            throw new Error('Band annotation value must be provided');
        }

        if (this.bandAnnotation) {
            return [{ ...this.annotation }, { ...this.bandAnnotation }];
        }
        return { ...this.annotation };
    }
}
