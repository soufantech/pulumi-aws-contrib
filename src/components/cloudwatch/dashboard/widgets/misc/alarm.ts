import * as awsx from '@pulumi/awsx/classic';
import { Widget } from '@pulumi/awsx/classic/cloudwatch';
import * as pulumi from '@pulumi/pulumi';

interface AlarmConfig {
    mainAlarms?: pulumi.Input<string>[];
    extraAlarms?: pulumi.Input<string>[];
}

export function alarm(alarmConfig?: AlarmConfig): Widget[] {
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

    const widgets: Widget[] = [];

    if (mainAlarms.length) {
        widgets.push(
            new awsx.cloudwatch.AlarmWidget({
                title: 'Main Alarms',
                width,
                height,
                sortBy: 'stateUpdatedTimestamp',
                alarms: mainAlarms,
            })
        );
    }

    if (extraAlarms.length) {
        widgets.push(
            new awsx.cloudwatch.AlarmWidget({
                title: 'Extra Alarms',
                width,
                height,
                sortBy: 'stateUpdatedTimestamp',
                alarms: extraAlarms,
            })
        );
    }

    return widgets;
}
