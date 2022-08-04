import AlarmStore from '../resources/alarm-store';

export interface AlarmStoreCommand {
    type: string;
    execute(ctx?: AlarmStore): any;
}
