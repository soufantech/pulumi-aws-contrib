import * as pulumi from '@pulumi/pulumi';

import { ecsServiceAlarm, tgAlarm } from './alarm-factories';
import AlarmGroup from './entities/AlarmGroup';
import { TargetGroupConfig, EcsServiceConfig, WrapperAlarmExtraConfigs } from './types';

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
            tgAlarm.createUptimeAlarm(this.name, threshold, tgConfig, {
                parent: this.alarm,
                ...extraConfigs,
            })
        );

        return this;
    }

    responseTime(
        threshold: number,
        tgConfig: TargetGroupConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            tgAlarm.createTargetResponseTimeAlarm(this.name, threshold, tgConfig, {
                parent: this.alarm,
                ...extraConfigs,
            })
        );

        return this;
    }

    requestCount(
        threshold: number,
        tgConfig: TargetGroupConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            tgAlarm.createRequestCountAlarm(this.name, threshold, tgConfig, {
                parent: this.alarm,
                ...extraConfigs,
            })
        );

        return this;
    }

    cpuUtilization(
        threshold: number,
        ecsServiceConfig: EcsServiceConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            ecsServiceAlarm.createCpuUtilizationAlarm(this.name, threshold, ecsServiceConfig, {
                parent: this.alarm,
                ...extraConfigs,
            })
        );

        return this;
    }

    memoryUtilization(
        threshold: number,
        ecsServiceConfig: EcsServiceConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            ecsServiceAlarm.createMemoryUtilizationAlarm(this.name, threshold, ecsServiceConfig, {
                parent: this.alarm,
                ...extraConfigs,
            })
        );

        return this;
    }

    networkRxBytes(
        threshold: number,
        ecsServiceConfig: EcsServiceConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            ecsServiceAlarm.createNetworkRxBytesAlarm(this.name, threshold, ecsServiceConfig, {
                parent: this.alarm,
                ...extraConfigs,
            })
        );

        return this;
    }

    networkTxBytesAlarm(
        threshold: number,
        ecsServiceConfig: EcsServiceConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            ecsServiceAlarm.createNetworkTxBytesAlarm(this.name, threshold, ecsServiceConfig, {
                parent: this.alarm,
                ...extraConfigs,
            })
        );

        return this;
    }

    storageReadBytes(
        threshold: number,
        ecsServiceConfig: EcsServiceConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            ecsServiceAlarm.createStorageReadBytesAlarm(this.name, threshold, ecsServiceConfig, {
                parent: this.alarm,
                ...extraConfigs,
            })
        );

        return this;
    }

    storageWriteBytes(
        threshold: number,
        ecsServiceConfig: EcsServiceConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarm.pushAlarm(
            ecsServiceAlarm.createStorageWriteBytesAlarm(this.name, threshold, ecsServiceConfig, {
                parent: this.alarm,
                ...extraConfigs,
            })
        );

        return this;
    }
}
