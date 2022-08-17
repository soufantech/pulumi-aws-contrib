import AlarmStore from '../resources/alarm-store';

export interface AlarmStoreCommand {
    execute(ctx?: AlarmStore): unknown;
}
