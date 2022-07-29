import * as pulumi from '@pulumi/pulumi';

import { ecsServiceAlarm } from './alarm-factories';
import AlarmGroup from './entities/alarm-group';
import EcsStorageBytesAlarm from './entities/ecs-storage-bytes-alarm';
import TgRequestCountAlarm from './entities/tg-request-count-alarm';
import TgResponseTimeAlarm from './entities/tg-response-time-alarm';
import TgUptimeAlarm from './entities/tg-upltime-alarm';
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
            new TgUptimeAlarm(
                getNameWithSuffix(this.name, extraConfigs?.suffix),
                threshold,
                tgConfig,
                {
                    parent: this.alarm,
                    ...extraConfigs,
                }
            ).getValue()
        );

        return this;
    }

    responseTime(
        threshold: number,
        tgConfig: TargetGroupConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            new TgResponseTimeAlarm(
                getNameWithSuffix(this.name, extraConfigs?.suffix),
                threshold,
                tgConfig,
                {
                    parent: this.alarm,
                    ...extraConfigs,
                }
            ).getValue()
        );

        return this;
    }

    requestCount(
        threshold: number,
        tgConfig: TargetGroupConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            new TgRequestCountAlarm(
                getNameWithSuffix(this.name, extraConfigs?.suffix),
                threshold,
                tgConfig,
                {
                    parent: this.alarm,
                    ...extraConfigs,
                }
            ).getValue()
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
            new EcsStorageBytesAlarm(
                getNameWithSuffix(this.name, extraConfigs?.suffix),
                threshold,
                ecsServiceConfig,
                {
                    parent: this.alarm,
                    ...extraConfigs,
                },
                'read'
            ).getValue()
        );

        return this;
    }

    storageWriteBytes(
        threshold: number,
        ecsServiceConfig: EcsServiceConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            new EcsStorageBytesAlarm(
                getNameWithSuffix(this.name, extraConfigs?.suffix),
                threshold,
                ecsServiceConfig,
                {
                    parent: this.alarm,
                    ...extraConfigs,
                },
                'write'
            ).getValue()
        );

        return this;
    }
}
