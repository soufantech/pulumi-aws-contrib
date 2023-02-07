import * as pulumi from '@pulumi/pulumi';

// Utility types

export type ValueOf<T> = T[keyof T];

// Service types

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

// Dashboard types

export interface Widget {
    width?: pulumi.Input<number>; // default: 6
    height?: pulumi.Input<number>; // default: 6
    x?: pulumi.Input<number>;
    y?: pulumi.Input<number>;
    type: 'text' | 'log' | 'alarm' | 'metric';
    properties: object;
}

export interface TextWidget extends Widget {
    type: 'text';
    properties: {
        markdown: pulumi.Input<string>;
        background?: pulumi.Input<'transparent' | 'solid'>; // default: solid
    };
}

export interface LogWidget extends Widget {
    type: 'log';
    properties: {
        region: pulumi.Input<string>;
        title?: pulumi.Input<string>;
        query: pulumi.Input<string>;
        view?: pulumi.Input<'table' | 'timeSeries' | 'bar' | 'pie'>;
    };
}

export interface AlarmWidget extends Widget {
    type: 'alarm';
    properties: {
        alarms: pulumi.Input<string>[];
        sortBy?: pulumi.Input<'default' | 'stateUpdatedTimestamp' | 'timestamp'>;
        states?: Array<pulumi.Input<'OK' | 'ALARM' | 'INSUFFICIENT_DATA'>>;
        title?: pulumi.Input<string>;
    };
}

export interface MetricWidget extends Widget {
    type: 'metric';
    properties: {
        accountId?: pulumi.Input<string>;
        annotations?: Annotations;
        liveData?: pulumi.Input<boolean>;
        legend?: {
            position: pulumi.Input<'hidden' | 'bottom' | 'right'>;
        };
        period?: pulumi.Input<number>; // default: 300
        region: pulumi.Input<string>;
        sparkline?: pulumi.Input<boolean>;
        stacked?: pulumi.Input<boolean>;
        stat?: pulumi.Input<string>;
        timezone?: pulumi.Input<string>;
        title?: pulumi.Input<string>;
        view?: pulumi.Input<'timeSeries' | 'singleValue' | 'gauge' | 'bar' | 'pie'>;
        yAxis?: YAxis;
        metrics: Array<SingleMetric | MetricExpression[]>;
    };
}

export type SingleMetric = Array<pulumi.Input<string> | RenderingProperties>;

export type MetricExpression = {
    expression: pulumi.Input<string>;
    label?: pulumi.Input<string>;
    id?: pulumi.Input<string>;
    region?: pulumi.Input<string>;
};

export type RenderingProperties = {
    color?: pulumi.Input<string>;
    label?: pulumi.Input<string>;
    id?: pulumi.Input<string>;
    period?: pulumi.Input<number>;
    region?: pulumi.Input<string>;
    stat?: pulumi.Input<string>;
    visible?: pulumi.Input<boolean>; // (default: true)
    yAxis?: pulumi.Input<'left' | 'right'>;
};

export type YAxis = {
    left?: YAxisProps;
    right?: YAxisProps;
};

export type YAxisProps = {
    min?: pulumi.Input<number>;
    max?: pulumi.Input<number>;
    showUnits?: pulumi.Input<boolean>;
    label?: pulumi.Input<string>;
};

export type Annotations = {
    alarms?: pulumi.Input<string>[];
    horizontal?: Array<SingleHorizontalAnnotation | BandedHorizontalAnnotation>;
    vertical?: Array<SingleVerticalAnnotation | BandedVerticalAnnotation>;
};

export type Annotation = {
    label?: pulumi.Input<string>;
    color?: pulumi.Input<string>;
    visible?: pulumi.Input<boolean>; // (default: true)
    yAxis?: pulumi.Input<'left' | 'right'>;
};

export type HorizontalAnnotation = Annotation & {
    value: pulumi.Input<number>;
    fill?: pulumi.Input<'none' | 'above' | 'below'>;
};

export type VerticalAnnotation = Annotation & {
    value: pulumi.Input<string>;
    fill?: pulumi.Input<'none' | 'before' | 'after'>;
};

export type HorizontalBandAnnotation = {
    value: HorizontalAnnotation['value'];
    label?: HorizontalAnnotation['label'];
};

export type VerticalBandAnnotation = {
    value: VerticalAnnotation['value'];
    label?: VerticalAnnotation['label'];
};

export type SingleHorizontalAnnotation = HorizontalAnnotation;

export type BandedHorizontalAnnotation = [HorizontalAnnotation, HorizontalBandAnnotation];

export type SingleVerticalAnnotation = VerticalAnnotation;

export type BandedVerticalAnnotation = [VerticalAnnotation, VerticalBandAnnotation];
