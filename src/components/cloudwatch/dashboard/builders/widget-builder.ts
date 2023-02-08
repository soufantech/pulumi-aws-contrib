import * as pulumi from '@pulumi/pulumi';

import type { Widget } from '../../types';

export interface WidgetBuilderArgs {
    type: Widget['type'];
    properties: Widget['properties'];
}

export abstract class WidgetBuilder {
    protected widgetAttributes: Widget;

    constructor(args: WidgetBuilderArgs) {
        this.widgetAttributes = {
            type: args.type,
            properties: args.properties,
        };
    }

    width(width: Widget['width']) {
        pulumi.output(width).apply((w) => {
            if ((w && w < 0) || (w && w > 24)) {
                throw new Error('Width must be between 0 and 24');
            }
        });

        this.widgetAttributes.width = width;
        return this;
    }

    height(height: Widget['height']) {
        pulumi.output(height).apply((h) => {
            if ((h && h < 0) || (h && h > 1000)) {
                throw new Error('Height must be between 0 and 1000');
            }
        });

        this.widgetAttributes.height = height;
        return this;
    }

    x(x: Widget['x']) {
        pulumi.output(x).apply((xis) => {
            if ((xis && xis < 0) || (xis && xis > 23)) {
                throw new Error('X must be between 0 and 23');
            }
        });

        this.widgetAttributes.x = x;
        return this;
    }

    y(y: Widget['y']) {
        this.widgetAttributes.y = y;
        return this;
    }

    abstract build(): pulumi.Output<Widget>;
}
