import * as pulumi from '@pulumi/pulumi';

export class AlarmAnnotationBuilder {
    private alarms: pulumi.Output<string>[] = [];

    addAlarm(alarm: pulumi.Input<string>) {
        this.alarms.push(pulumi.output(alarm));
        return this;
    }

    build(): pulumi.Output<string>[] {
        if (this.alarms.length === 0) {
            throw new Error('At least one alarm must be provided');
        }

        return [...this.alarms];
    }
}
