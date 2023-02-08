import type { AlarmStore } from './alarm-store';

export interface AlarmStoreCommand {
    execute(ctx?: AlarmStore): unknown;
}
