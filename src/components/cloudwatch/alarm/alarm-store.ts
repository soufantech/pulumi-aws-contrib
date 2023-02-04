import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import { AlarmStoreCommand } from './alarm-store-command';
import { CreateAlarmCommand } from './create-alarm-command';

export class AlarmStore extends pulumi.ComponentResource {
    private alarms: aws.cloudwatch.MetricAlarm[];

    constructor(name: string, args?: pulumi.Inputs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:AlarmStore', name, args, opts);
        this.alarms = [];
    }

    private createAlarmReducer(command: CreateAlarmCommand) {
        this.alarms.push(command.execute(this));
    }

    dispatch(...commands: AlarmStoreCommand[]) {
        commands.forEach((command) => {
            if (command instanceof CreateAlarmCommand) this.createAlarmReducer(command);
        });
    }

    getAlarms() {
        return this.alarms;
    }

    getArns() {
        return this.alarms.map((alarm) => alarm.arn);
    }
}
