import * as pulumi from '@pulumi/pulumi';

import { Widget, TextWidget } from '../../types';
import { WidgetBuilder } from './widget-builder';

export class TextWidgetBuilder extends WidgetBuilder {
    private properties: TextWidget['properties'];

    constructor() {
        super({ type: 'text', properties: {} });
        this.properties = { markdown: '' };
    }

    background(background: TextWidget['properties']['background']) {
        this.properties.background = background;
        return this;
    }

    markdown(markdown: TextWidget['properties']['markdown']) {
        this.properties.markdown = markdown;
        return this;
    }

    build(): pulumi.Output<Widget> {
        if (!this.properties.markdown) {
            throw new Error('Markdown must not be empty');
        }

        const widget: Widget = {
            ...this.widgetAttributes,
            properties: this.properties,
        };

        return pulumi.all(widget as Record<string, any>) as pulumi.Output<Widget>;
    }
}
