import { MetricAlarm } from '@pulumi/aws/cloudwatch';

import AlarmStore from '../resources/alarm-store';

export interface CreateAlarmCommand {
    execute(parent?: AlarmStore): MetricAlarm;
}
