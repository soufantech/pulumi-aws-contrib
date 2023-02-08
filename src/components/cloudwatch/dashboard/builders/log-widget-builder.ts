import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import { Widget, LogWidget } from '../../types';
import { WidgetBuilder } from './widget-builder';

export type LogWidgetBuilderArgs = {
    region?: LogWidget['properties']['region'];
};

export class LogWidgetBuilder extends WidgetBuilder {
    private properties: LogWidget['properties'];

    constructor(args?: LogWidgetBuilderArgs) {
        super({ type: 'log', properties: {} });
        this.properties = {
            region: args?.region ?? aws.getRegionOutput().name,
            query: '',
        };
    }

    region(region: LogWidget['properties']['region']) {
        this.properties.region = region;
        return this;
    }

    title(title: LogWidget['properties']['title']) {
        this.properties.title = title;
        return this;
    }

    query(query: LogWidget['properties']['query']) {
        this.properties.query = query;
        return this;
    }

    view(view: LogWidget['properties']['view']) {
        this.properties.view = view;
        return this;
    }

    build(): pulumi.Output<Widget> {
        if (!this.properties.query) {
            throw new Error('Query must not be empty');
        }

        const widget: Widget = {
            ...this.widgetAttributes,
            properties: this.properties,
        };

        return pulumi.all(widget as Record<string, any>) as pulumi.Output<Widget>;
    }
}
