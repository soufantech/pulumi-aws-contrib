import { MetricAlarm } from '@pulumi/aws/cloudwatch';
import { Resource } from '@pulumi/pulumi';

export interface CreateAlarmCommand {
    execute(parent?: Resource): MetricAlarm;
}
