import lazyLoad from '../../../lazy-load';

export * from './widgets';

export type DashboardBuilder = import('./dashboard-builder').DashboardBuilder;
export const DashboardBuilder: typeof import('./dashboard-builder').DashboardBuilder = null as any;
lazyLoad(exports, ['DashboardBuilder'], () => require('./dashboard-builder'));
