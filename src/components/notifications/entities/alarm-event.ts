export interface AlarmEvent {
    AlarmName: string;
    AlarmDescription: null | string;
    AWSAccountId: string;
    AlarmConfigurationUpdatedTimestamp: string;
    NewStateValue: 'OK' | 'ALARM';
    NewStateReason: string;
    StateChangeTime: string;
    Region: string;
    AlarmArn: string;
    OldStateValue: string;
    Trigger: Trigger;
}

export interface Trigger {
    MetricName: string;
    Namespace: string;
    StatisticType: string;
    Statistic: string;
    Unit: unknown;
    Dimensions: Dimension[];
    Period: number;
    EvaluationPeriods: number;
    DatapointsToAlarm: number;
    ComparisonOperator: string;
    Threshold: number;
    TreatMissingData: string;
    EvaluateLowSampleCountPercentile: string;
}

export interface Dimension {
    value: string;
    name: string;
}
