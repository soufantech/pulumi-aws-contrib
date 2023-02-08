import * as pulumi from '@pulumi/pulumi';

import { Widget, AlarmWidget } from '../../types';
import { WidgetBuilder } from './widget-builder';

export class AlarmWidgetBuilder extends WidgetBuilder {
    private properties: AlarmWidget['properties'];

    constructor() {
        super({ type: 'alarm', properties: {} });
        this.properties = { alarms: [] };
    }

    addAlarms(
        alarms: AlarmWidget['properties']['alarms'][number] | AlarmWidget['properties']['alarms']
    ) {
        if (Array.isArray(alarms)) {
            this.properties.alarms.push(...alarms);
            return this;
        }

        this.properties.alarms.push(alarms);
        return this;
    }

    sortBy(sortBy: AlarmWidget['properties']['sortBy']) {
        this.properties.sortBy = sortBy;
        return this;
    }

    states(states: AlarmWidget['properties']['states']) {
        this.properties.states = states;
        return this;
    }

    title(title: AlarmWidget['properties']['title']) {
        this.properties.title = title;
        return this;
    }

    build(): pulumi.Output<Widget> {
        if (!this.properties.alarms.length) {
            throw new Error('Alarms must not be empty');
        }

        const widget: Widget = {
            ...this.widgetAttributes,
            properties: this.properties,
        };

        return pulumi.all(widget as Record<string, any>) as pulumi.Output<Widget>;
    }
}
