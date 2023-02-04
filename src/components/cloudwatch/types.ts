import * as pulumi from '@pulumi/pulumi';

export type ValueOf<T> = T[keyof T];

export interface EcsClusterConfig {
    clusterName: pulumi.Input<string>;
}

export interface EcsServiceConfig {
    clusterName: pulumi.Input<string>;
    serviceName: pulumi.Input<string>;
}

export interface AlbConfig {
    loadBalancer: pulumi.Input<string>;
}

export interface TargetGroupConfig {
    loadBalancer: pulumi.Input<string>;
    targetGroup: pulumi.Input<string>;
}

export interface AsgConfig {
    asgName: pulumi.Input<string>;
}

export interface EcsClusterWithAsgConfig {
    clusterName: pulumi.Input<string>;
    asgName?: pulumi.Input<string>;
}

export interface EcsServiceWithAsgConfig {
    clusterName: pulumi.Input<string>;
    serviceName: pulumi.Input<string>;
    asgName?: pulumi.Input<string>;
}

export interface EcsAggregationServiceConfig {
    serviceConfig: EcsServiceConfig;
    targetGroupConfig?: TargetGroupConfig;
}

export interface EcsAggregationInstanceConfig {
    asgConfig: AsgConfig;
}

export type EcsAggregationConfig = {
    services: EcsAggregationServiceConfig[];
    instances?: EcsAggregationInstanceConfig[];
};

export interface RdsConfig {
    dbInstanceIdentifier: pulumi.Input<string>;
}

export interface NonAnomalyDetectionAlarmExtraConfigs {
    suffix?: string;
    snsTopicArns?: pulumi.Input<string>[];
    datapointsToAlarm?: pulumi.Input<number>;
    evaluationPeriods?: pulumi.Input<number>;
    treatMissingData?: pulumi.Input<'missing' | 'ignore' | 'breaching' | 'notBreaching'>;
    period?: pulumi.Input<number>;
}

export interface AlarmExtraConfigs extends NonAnomalyDetectionAlarmExtraConfigs {
    standardDeviation?: pulumi.Input<number>;
}

export interface WidgetExtraConfigs {
    shortPeriod?: pulumi.Input<number>;
    longPeriod?: pulumi.Input<number>;
}
