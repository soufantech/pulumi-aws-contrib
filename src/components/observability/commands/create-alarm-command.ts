import { MetricAlarm } from '@pulumi/aws/cloudwatch';

import AlarmStore from '../resources/alarm-store';
import { AlarmStoreCommand } from './alarm-store-command';

export abstract class CreateAlarmCommand implements AlarmStoreCommand {
    type = 'CreateAlarm';

    abstract execute(ctx?: AlarmStore): MetricAlarm;
}
