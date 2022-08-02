import aws from '@pulumi/aws';
import { Widget } from '@pulumi/awsx/cloudwatch';
import pulumi from '@pulumi/pulumi';

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

export interface ExtraWidgets {
    begin?: Widget[];
    end?: Widget[];
}

export interface AlarmExtraConfigs {
    parent?: pulumi.Resource;
    snsTopicArns?: string[];
    datapointsToAlarm?: number;
    evaluationPeriods?: number;
    treatMissingData?: 'missing' | 'ignore' | 'breaching' | 'notBreaching';
    standardDeviation?: number;
    period?: number;
}

export interface WrapperAlarmExtraConfigs extends Omit<AlarmExtraConfigs, 'parent'> {
    suffix?: string;
}

export interface WidgetExtraConfigs {
    shortPeriod?: number;
    longPeriod?: number;
}

export interface WrapperWidgetExtraConfigs {
    shortPeriod?: number;
    longPeriod?: number;
}

export type AlarmFactory = (
    name: string,
    threshold: number,
    configs: Record<string, string>,
    extraConfigs?: AlarmExtraConfigs
) => aws.cloudwatch.MetricAlarm;

export type WrapperAlarmFactory = (
    name: string,
    threshold: number,
    configs: Record<string, string>,
    extraConfigs?: WrapperAlarmExtraConfigs
) => aws.cloudwatch.MetricAlarm | undefined;

export type WidgetFactory = (
    configs: Record<string, string>,
    extraConfigs?: WidgetExtraConfigs
) => Widget[];

export type WrapperWidgetFactory = (
    configs: Record<string, string>,
    extraConfigs?: WrapperWidgetExtraConfigs
) => Widget[];
