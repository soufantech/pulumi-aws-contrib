import { Widget } from '@pulumi/awsx/cloudwatch/widget';
import pulumi from '@pulumi/pulumi';

export interface ClusterConfig {
    clusterName: string;
}

export interface ServiceConfig {
    clusterName: string;
    serviceName: string;
}

export interface AlbConfig {
    loadBalancer: string;
    targetGroup: string;
}

export interface AsgConfig {
    asgName: string;
}

export interface ExtraWidgets {
    begin?: Widget[];
    end?: Widget[];
}

export interface AlarmExtraConfigs {
    parent?: pulumi.Resource;
    snsTopicArns?: string[];
}
