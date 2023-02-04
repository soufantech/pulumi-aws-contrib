import lazyLoad from '../../../../../lazy-load';

export type CreateBurstBalanceAlarmCommand = import('./create-burst-balance-alarm').CreateBurstBalanceAlarmCommand;
export const CreateBurstBalanceAlarmCommand: typeof import('./create-burst-balance-alarm').CreateBurstBalanceAlarmCommand = null as any;
lazyLoad(exports, ['CreateBurstBalanceAlarmCommand'], () => require('./create-burst-balance-alarm'));

export type CreateCpuUtilizationAlarmCommand = import('./create-cpu-utilization-alarm').CreateCpuUtilizationAlarmCommand;
export const CreateCpuUtilizationAlarmCommand: typeof import('./create-cpu-utilization-alarm').CreateCpuUtilizationAlarmCommand = null as any;
lazyLoad(exports, ['CreateCpuUtilizationAlarmCommand'], () => require('./create-cpu-utilization-alarm'));

export type CreateDatabaseConnectionsAlarmCommand = import('./create-database-connections-alarm').CreateDatabaseConnectionsAlarmCommand;
export const CreateDatabaseConnectionsAlarmCommand: typeof import('./create-database-connections-alarm').CreateDatabaseConnectionsAlarmCommand = null as any;
lazyLoad(exports, ['CreateDatabaseConnectionsAlarmCommand'], () => require('./create-database-connections-alarm'));

export type CreateFreeStorageSpaceAlarmCommand = import('./create-free-storage-space-alarm').CreateFreeStorageSpaceAlarmCommand;
export const CreateFreeStorageSpaceAlarmCommand: typeof import('./create-free-storage-space-alarm').CreateFreeStorageSpaceAlarmCommand = null as any;
lazyLoad(exports, ['CreateFreeStorageSpaceAlarmCommand'], () => require('./create-free-storage-space-alarm'));

export type CreateFreeableMemoryAlarmCommand = import('./create-freeable-memory-alarm').CreateFreeableMemoryAlarmCommand;
export const CreateFreeableMemoryAlarmCommand: typeof import('./create-freeable-memory-alarm').CreateFreeableMemoryAlarmCommand = null as any;
lazyLoad(exports, ['CreateFreeableMemoryAlarmCommand'], () => require('./create-freeable-memory-alarm'));
