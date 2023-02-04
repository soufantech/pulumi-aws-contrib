import lazyLoad from '../../../../../lazy-load';

export const createMemoryAndCpuExtraWidgets: typeof import('./create-memory-and-cpu-extra-widgets').createMemoryAndCpuExtraWidgets = null as any;
lazyLoad(exports, ['createMemoryAndCpuExtraWidgets'], () => require('./create-memory-and-cpu-extra-widgets'));

export const createMemoryAndCpuWidgets: typeof import('./create-memory-and-cpu-widgets').createMemoryAndCpuWidgets = null as any;
lazyLoad(exports, ['createMemoryAndCpuWidgets'], () => require('./create-memory-and-cpu-widgets'));

export const createNetworkAndStorageWidgets: typeof import('./create-network-and-storage-widgets').createNetworkAndStorageWidgets = null as any;
lazyLoad(exports, ['createNetworkAndStorageWidgets'], () => require('./create-network-and-storage-widgets'));

export const createTaskCountWidgets: typeof import('./create-task-count-widgets').createTaskCountWidgets = null as any;
lazyLoad(exports, ['createTaskCountWidgets'], () => require('./create-task-count-widgets'));
