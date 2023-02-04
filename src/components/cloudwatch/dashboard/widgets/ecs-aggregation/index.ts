import lazyLoad from '../../../../../lazy-load';

export const createInstanceMemoryAndCpuWidgets: typeof import('./create-instance-memory-and-cpu-widgets').createInstanceMemoryAndCpuWidgets = null as any;
lazyLoad(exports, ['createInstanceMemoryAndCpuWidgets'], () => require('./create-instance-memory-and-cpu-widgets'));

export const createLatencyAndRequestCountWidgets: typeof import('./create-latency-and-request-count-widgets').createLatencyAndRequestCountWidgets = null as any;
lazyLoad(exports, ['createLatencyAndRequestCountWidgets'], () => require('./create-latency-and-request-count-widgets'));

export const createServiceMemoryAndCpuWidgets: typeof import('./create-service-memory-and-cpu-widgets').createServiceMemoryAndCpuWidgets = null as any;
lazyLoad(exports, ['createServiceMemoryAndCpuWidgets'], () => require('./create-service-memory-and-cpu-widgets'));

export const createTaskCountWidgets: typeof import('./create-task-count-widgets').createTaskCountWidgets = null as any;
lazyLoad(exports, ['createTaskCountWidgets'], () => require('./create-task-count-widgets'));

export const createUptimeAndHealthyWidgets: typeof import('./create-uptime-and-healthy-widgets').createUptimeAndHealthyWidgets = null as any;
lazyLoad(exports, ['createUptimeAndHealthyWidgets'], () => require('./create-uptime-and-healthy-widgets'));
