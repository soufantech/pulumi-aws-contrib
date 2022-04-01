/* eslint-disable sonarjs/no-duplicate-string */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export type EcsClusterAlarmConfigKey = 'clusterName' | 'asgName';

export type EcsClusterAlarmConfig = {
    [config in EcsClusterAlarmConfigKey]?: string;
};

export type EcsClusterAlarmOptionKey =
    | 'asgGroupMaxSize';

export type EcsClusterAlarmOption = {
    [option in EcsClusterAlarmOptionKey]?: number;
}

export type EcsClusterAlarmResult = {
    [option in EcsClusterAlarmOptionKey]?: aws.cloudwatch.MetricAlarm;
}

export interface EcsClusterAlarmArgs {
    configs: EcsClusterAlarmConfig;
    options: EcsClusterAlarmOption;
    snsTopicArns?: string[];
}

export type EcsClusterAlarmActionValue = (
    name: string,
    threshold: number,
    config: EcsClusterAlarmConfig,
    snsTopicArns?: string[]
) => aws.cloudwatch.MetricAlarm | undefined;

export type EcsClusterAlarmActionDict = {
    [option in EcsClusterAlarmOptionKey]: EcsClusterAlarmActionValue;
};

const shortPeriod = 60;
const datapoints = 6;

export default class EcsClusterAlarm extends pulumi.ComponentResource {
    readonly alarms?: EcsClusterAlarmResult;

    readonly actionDict: EcsClusterAlarmActionDict = {
        asgGroupMaxSize: this.createAsgMaxGroupSizeAlarm,
    };

    constructor(name: string, args: EcsClusterAlarmArgs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:EcsClusterAlarm', name, {}, opts);

        const { configs, options, snsTopicArns } = args;

        const alarms: EcsClusterAlarmResult = {};

        const optionKeys = Object.keys(options) as EcsClusterAlarmOptionKey[];

        /* eslint-disable security/detect-object-injection */
        optionKeys.forEach((optionKey) => {
            const threshold = options[optionKey];
            if (!threshold) return;

            const alarm = this.actionDict[optionKey].bind(this)(
                name,
                threshold,
                configs,
                snsTopicArns
            );

            if (alarm) {
                alarms[optionKey] = alarm;
            }
        });
        /* eslint-disable security/detect-object-injection */

        this.alarms = alarms;
    }

    private createAsgMaxGroupSizeAlarm(
        name: string,
        threshold: number,
        configs: EcsClusterAlarmConfig,
        snsTopicArns?: string[]
    ): aws.cloudwatch.MetricAlarm | undefined {
        const { asgName } = configs;
        if (!asgName) return undefined;

        return new aws.cloudwatch.MetricAlarm(
            `${name}-asg-max-size`,
            {
                comparisonOperator: 'GreaterThanOrEqualToThreshold',
                threshold,
                evaluationPeriods: datapoints,
                metricQueries: [
                    {
                        id: 'e1',
                        expression: '(m1*100)/m2',
                        label: 'AsgMaxSize',
                        returnData: true,
                    },
                    {
                        id: 'm1',
                        metric: {
                            namespace: 'AWS/AutoScaling',
                            metricName: 'GroupInServiceInstances',
                            dimensions: { AutoScalingGroupName: asgName },
                            period: shortPeriod,
                            stat: 'Maximum',
                        },
                    },
                    {
                        id: 'm2',
                        metric: {
                            namespace: 'AWS/AutoScaling',
                            metricName: 'GroupMaxSize',
                            dimensions: { AutoScalingGroupName: asgName },
                            period: shortPeriod,
                            stat: 'Maximum',
                        },
                    },
                ],
                alarmActions: snsTopicArns,
                okActions: snsTopicArns,
            },
            { parent: this }
        );
    }
}
