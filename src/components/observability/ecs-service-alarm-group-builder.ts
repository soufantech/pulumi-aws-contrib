import * as pulumi from '@pulumi/pulumi';

import { ecsServiceAlarm, tgAlarm } from './alarm-factories';
import AlarmGroup from './entities/AlarmGroup';
import { TargetGroupConfig, EcsServiceConfig, WrapperAlarmExtraConfigs } from './types';

function getNameWithSuffix(name: string, suffix?: string) {
    if (!suffix) return name;
    return `${name}-${suffix}`;
}

export default class EcsServiceAlarmGroupBuilder {
    private alarm: AlarmGroup;

    private name: string;

    constructor(name: string, opts?: pulumi.ResourceOptions) {
        this.name = name;
        this.alarm = new AlarmGroup('contrib:components:EcsServiceDashboard', name, opts);
    }

    build() {
        return this.alarm;
    }

    uptime(
        threshold: number,
        tgConfig: TargetGroupConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            tgAlarm.createUptimeAlarm(
                getNameWithSuffix(this.name, extraConfigs?.suffix),
                threshold,
                tgConfig,
                {
                    parent: this.alarm,
                    ...extraConfigs,
                }
            )
        );

        return this;
    }

    responseTime(
        threshold: number,
        tgConfig: TargetGroupConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            tgAlarm.createTargetResponseTimeAlarm(
                getNameWithSuffix(this.name, extraConfigs?.suffix),
                threshold,
                tgConfig,
                {
                    parent: this.alarm,
                    ...extraConfigs,
                }
            )
        );

        return this;
    }

    requestCount(
        threshold: number,
        tgConfig: TargetGroupConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            tgAlarm.createRequestCountAlarm(
                getNameWithSuffix(this.name, extraConfigs?.suffix),
                threshold,
                tgConfig,
                {
                    parent: this.alarm,
                    ...extraConfigs,
                }
            )
        );

        return this;
    }

    cpuUtilization(
        threshold: number,
        ecsServiceConfig: EcsServiceConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            ecsServiceAlarm.createCpuUtilizationAlarm(
                getNameWithSuffix(this.name, extraConfigs?.suffix),
                threshold,
                ecsServiceConfig,
                {
                    parent: this.alarm,
                    ...extraConfigs,
                }
            )
        );

        return this;
    }

    memoryUtilization(
        threshold: number,
        ecsServiceConfig: EcsServiceConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            ecsServiceAlarm.createMemoryUtilizationAlarm(
                getNameWithSuffix(this.name, extraConfigs?.suffix),
                threshold,
                ecsServiceConfig,
                {
                    parent: this.alarm,
                    ...extraConfigs,
                }
            )
        );

        return this;
    }

    networkRxBytes(
        threshold: number,
        ecsServiceConfig: EcsServiceConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            ecsServiceAlarm.createNetworkRxBytesAlarm(
                getNameWithSuffix(this.name, extraConfigs?.suffix),
                threshold,
                ecsServiceConfig,
                {
                    parent: this.alarm,
                    ...extraConfigs,
                }
            )
        );

        return this;
    }

    networkTxBytesAlarm(
        threshold: number,
        ecsServiceConfig: EcsServiceConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            ecsServiceAlarm.createNetworkTxBytesAlarm(
                getNameWithSuffix(this.name, extraConfigs?.suffix),
                threshold,
                ecsServiceConfig,
                {
                    parent: this.alarm,
                    ...extraConfigs,
                }
            )
        );

        return this;
    }

    storageReadBytes(
        threshold: number,
        ecsServiceConfig: EcsServiceConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            ecsServiceAlarm.createStorageReadBytesAlarm(
                getNameWithSuffix(this.name, extraConfigs?.suffix),
                threshold,
                ecsServiceConfig,
                {
                    parent: this.alarm,
                    ...extraConfigs,
                }
            )
        );

        return this;
    }

    storageWriteBytes(
        threshold: number,
        ecsServiceConfig: EcsServiceConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            ecsServiceAlarm.createStorageWriteBytesAlarm(
                getNameWithSuffix(this.name, extraConfigs?.suffix),
                threshold,
                ecsServiceConfig,
                {
                    parent: this.alarm,
                    ...extraConfigs,
                }
            )
        );

        return this;
    }
}
