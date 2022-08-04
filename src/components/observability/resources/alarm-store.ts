import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import { AlarmStoreCommand } from '../commands/alarm-store-command';
import { CreateAlarmCommand } from '../commands/create-alarm-command';

export default class AlarmStore extends pulumi.ComponentResource {
    private alarms: aws.cloudwatch.MetricAlarm[];

    constructor(type: string, name: string, args?: pulumi.Inputs, opts?: pulumi.ResourceOptions) {
        super(type, name, args, opts);
        this.alarms = [];
    }

    private createAlarmReducer(command: CreateAlarmCommand) {
        this.alarms.push(command.execute(this));
    }

    dispatch(...commands: AlarmStoreCommand[]) {
        commands.forEach((command) => {
            if (command.type === 'CreateAlarm') this.createAlarmReducer(command);
        });
    }

    getAlarms() {
        return this.alarms;
    }

    getArns() {
        return this.alarms.map((alarm) => alarm.arn);
    }
}
