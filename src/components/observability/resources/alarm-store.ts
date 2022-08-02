import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import { CreateAlarmCommand } from '../commands/create-alarm-command';

export default class AlarmStore extends pulumi.ComponentResource {
    private alarms: aws.cloudwatch.MetricAlarm[];

    constructor(type: string, name: string, opts?: pulumi.ResourceOptions) {
        super(type, name, {}, opts);
        this.alarms = [];
    }

    dispatch(...commands: CreateAlarmCommand[]) {
        commands.forEach((command) => {
            this.alarms.push(command.execute(this));
        });
    }

    getAlarms() {
        return this.alarms;
    }

    getArns() {
        return this.alarms.map((alarm) => alarm.arn);
    }
}
