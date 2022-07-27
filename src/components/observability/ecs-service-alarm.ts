import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import { ecsServiceAlarm, tgAlarm } from './alarm-factories';
import { TargetGroupConfig, EcsServiceConfig, WrapperAlarmExtraConfigs } from './types';

export default class EcsServiceAlarm extends pulumi.ComponentResource {
    alarms: aws.cloudwatch.MetricAlarm[];

    private name: string;

    constructor(name: string, opts?: pulumi.ResourceOptions) {
        super('contrib:components:EcsServiceAlarm', name, {}, opts);
        this.name = name;
        this.alarms = [];
    }

    uptime(
        threshold: number,
        tgConfig: TargetGroupConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ): EcsServiceAlarm {
        this.alarms.push(
            tgAlarm.createUptimeAlarm(this.name, threshold, tgConfig, {
                parent: this,
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
        this.alarms.push(
            tgAlarm.createTargetResponseTimeAlarm(this.name, threshold, tgConfig, {
                parent: this,
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
        this.alarms.push(
            tgAlarm.createRequestCountAlarm(this.name, threshold, tgConfig, {
                parent: this,
                ...extraConfigs,
            })
        );

        return this;
    }

    requestSpikeCount(
        threshold: number,
        tgConfig: TargetGroupConfig,
        extraConfigs?: WrapperAlarmExtraConfigs
    ) {
        this.alarms.push(
            tgAlarm.createRequestSpikeCountAlarm(this.name, threshold, tgConfig, {
                parent: this,
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
        this.alarms.push(
            ecsServiceAlarm.createCpuUtilizationAlarm(this.name, threshold, ecsServiceConfig, {
                parent: this,
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
        this.alarms.push(
            ecsServiceAlarm.createMemoryUtilizationAlarm(this.name, threshold, ecsServiceConfig, {
                parent: this,
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
        this.alarms.push(
            ecsServiceAlarm.createNetworkRxBytesAlarm(this.name, threshold, ecsServiceConfig, {
                parent: this,
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
        this.alarms.push(
            ecsServiceAlarm.createNetworkTxBytesAlarm(this.name, threshold, ecsServiceConfig, {
                parent: this,
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
        this.alarms.push(
            ecsServiceAlarm.createStorageReadBytesAlarm(this.name, threshold, ecsServiceConfig, {
                parent: this,
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
        this.alarms.push(
            ecsServiceAlarm.createStorageWriteBytesAlarm(this.name, threshold, ecsServiceConfig, {
                parent: this,
                ...extraConfigs,
            })
        );

        return this;
    }

    getArns() {
        return this.alarms.map((alarm) => alarm.arn);
    }
}
