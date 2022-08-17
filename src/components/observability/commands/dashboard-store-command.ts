import { DashboardStore } from '../resources/dashboard-store';

export interface DashboardStoreCommand {
    execute(parent: DashboardStore): unknown;
}
