import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export default class AlarmGroup extends pulumi.ComponentResource {
    alarms: aws.cloudwatch.MetricAlarm[];

    constructor(type: string, name: string, opts?: pulumi.ResourceOptions) {
        super(type, name, {}, opts);
        this.alarms = [];
    }

    pushAlarm(alarm: aws.cloudwatch.MetricAlarm) {
        this.alarms.push(alarm);
    }

    getArns() {
        return this.alarms.map((alarm) => alarm.arn);
    }
}
