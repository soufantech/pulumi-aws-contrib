import * as pulumi from '@pulumi/pulumi';

import { Widget } from '../../../types';
import { AlarmWidgetBuilder } from '../../builders';

interface AlarmConfig {
    mainAlarms?: pulumi.Input<string>[];
    extraAlarms?: pulumi.Input<string>[];
}

export function alarm(alarmConfig?: AlarmConfig): pulumi.Output<Widget>[] {
    const mainAlarms = alarmConfig?.mainAlarms || [];
    const extraAlarms = alarmConfig?.extraAlarms || [];

    if (!mainAlarms.length && !extraAlarms.length) {
        return [];
    }

    let width = 12;
    let height = 6;
    if (!!mainAlarms.length !== !!extraAlarms.length) {
        width = 24;
        height = 4;
    }

    const widgets: pulumi.Output<Widget>[] = [];

    if (mainAlarms.length) {
        widgets.push(
            new AlarmWidgetBuilder()
                .title('Main Alarms')
                .width(width)
                .height(height)
                .sortBy('stateUpdatedTimestamp')
                .addAlarms(mainAlarms)
                .build()
        );
    }

    if (extraAlarms.length) {
        widgets.push(
            new AlarmWidgetBuilder()
                .title('Extra Alarms')
                .width(width)
                .height(height)
                .sortBy('stateUpdatedTimestamp')
                .addAlarms(extraAlarms)
                .build()
        );
    }

    return widgets;
}
