import { AlarmStore } from '../stores';

export interface AlarmStoreCommand {
    execute(ctx?: AlarmStore): unknown;
}
