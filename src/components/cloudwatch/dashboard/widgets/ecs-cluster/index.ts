import lazyLoad from '../../../../../lazy-load';

export const createMemoryAndCpuWidgets: typeof import('./create-memory-and-cpu-widgets').createMemoryAndCpuWidgets = null as any;
lazyLoad(exports, ['createMemoryAndCpuWidgets'], () => require('./create-memory-and-cpu-widgets'));

export const createNetworkAndStorageRateWidgets: typeof import('./create-network-and-storage-rate-widgets').createNetworkAndStorageRateWidgets = null as any;
lazyLoad(exports, ['createNetworkAndStorageRateWidgets'], () => require('./create-network-and-storage-rate-widgets'));

export const createTaskCountWidgets: typeof import('./create-task-count-widgets').createTaskCountWidgets = null as any;
lazyLoad(exports, ['createTaskCountWidgets'], () => require('./create-task-count-widgets'));
