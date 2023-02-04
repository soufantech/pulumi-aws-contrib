import lazyLoad from '../../../lazy-load';

export * from './commands';

export type AlarmStore = import('./alarm-store').AlarmStore;
export const AlarmStore: typeof import('./alarm-store').AlarmStore = null as any;
lazyLoad(exports, ['AlarmStore'], () => require('./alarm-store'));
