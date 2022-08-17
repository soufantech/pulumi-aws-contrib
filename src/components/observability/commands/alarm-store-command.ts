import { AlarmStore } from '../resources';

export interface AlarmStoreCommand {
    execute(ctx?: AlarmStore): unknown;
}
