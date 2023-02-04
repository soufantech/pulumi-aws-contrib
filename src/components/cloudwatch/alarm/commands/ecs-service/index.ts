import lazyLoad from '../../../../../lazy-load';

export type CreateCpuUtilizationAlarmCommand = import('./create-cpu-utilization-alarm').CreateCpuUtilizationAlarmCommand;
export const CreateCpuUtilizationAlarmCommand: typeof import('./create-cpu-utilization-alarm').CreateCpuUtilizationAlarmCommand = null as any;
lazyLoad(exports, ['CreateCpuUtilizationAlarmCommand'], () => require('./create-cpu-utilization-alarm'));

export type CreateMemoryUtilizationAlarmCommand = import('./create-memory-utilization-alarm').CreateMemoryUtilizationAlarmCommand;
export const CreateMemoryUtilizationAlarmCommand: typeof import('./create-memory-utilization-alarm').CreateMemoryUtilizationAlarmCommand = null as any;
lazyLoad(exports, ['CreateMemoryUtilizationAlarmCommand'], () => require('./create-memory-utilization-alarm'));

export type CreateNetworkBytesAlarmCommand = import('./create-network-bytes-alarm').CreateNetworkBytesAlarmCommand;
export const CreateNetworkBytesAlarmCommand: typeof import('./create-network-bytes-alarm').CreateNetworkBytesAlarmCommand = null as any;
lazyLoad(exports, ['CreateNetworkBytesAlarmCommand'], () => require('./create-network-bytes-alarm'));

export type CreateStorageBytesAlarmCommand = import('./create-storage-bytes-alarm').CreateStorageBytesAlarmCommand;
export const CreateStorageBytesAlarmCommand: typeof import('./create-storage-bytes-alarm').CreateStorageBytesAlarmCommand = null as any;
lazyLoad(exports, ['CreateStorageBytesAlarmCommand'], () => require('./create-storage-bytes-alarm'));
