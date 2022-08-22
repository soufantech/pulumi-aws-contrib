export type ValueOf<T> = T[keyof T];

export interface EcsClusterConfig {
    clusterName: string;
}

export interface EcsServiceConfig {
    clusterName: string;
    serviceName: string;
}

export interface AlbConfig {
    loadBalancer: string;
}

export interface TargetGroupConfig {
    loadBalancer: string;
    targetGroup: string;
}

export interface AsgConfig {
    asgName: string;
}

export interface EcsClusterWithAsgConfig {
    clusterName: string;
    asgName?: string;
}

export interface EcsServiceWithAsgConfig {
    clusterName: string;
    serviceName: string;
    asgName?: string;
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

export interface NonAnomalyDetectionAlarmExtraConfigs {
    snsTopicArns?: string[];
    datapointsToAlarm?: number;
    evaluationPeriods?: number;
    treatMissingData?: 'missing' | 'ignore' | 'breaching' | 'notBreaching';
    period?: number;
    suffix?: string;
}

export interface AlarmExtraConfigs extends NonAnomalyDetectionAlarmExtraConfigs {
    standardDeviation?: number;
}

export interface WidgetExtraConfigs {
    shortPeriod?: number;
    longPeriod?: number;
}
