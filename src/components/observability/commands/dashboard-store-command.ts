import { DashboardStore } from '../resources/widget-store';

export interface DashboardStoreCommand {
    type: string;
    execute(parent: DashboardStore): any;
}
