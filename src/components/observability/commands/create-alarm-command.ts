import { MetricAlarm } from '@pulumi/aws/cloudwatch';

import { AlarmStore } from '../resources';
import { AlarmStoreCommand } from './alarm-store-command';

export abstract class CreateAlarmCommand implements AlarmStoreCommand {
    abstract execute(ctx?: AlarmStore): MetricAlarm;
}
