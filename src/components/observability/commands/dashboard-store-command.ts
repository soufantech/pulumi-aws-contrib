import { DashboardStore } from '../resources/dashboard-store';

export interface DashboardStoreCommand {
    type: string;
    execute(parent: DashboardStore): any;
}
