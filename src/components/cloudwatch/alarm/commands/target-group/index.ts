import lazyLoad from '../../../../../lazy-load';

export type CreateRequestCountAlarmCommand = import('./create-request-count-alarm').CreateRequestCountAlarmCommand;
export const CreateRequestCountAlarmCommand: typeof import('./create-request-count-alarm').CreateRequestCountAlarmCommand = null as any;
lazyLoad(exports, ['CreateRequestCountAlarmCommand'], () => require('./create-request-count-alarm'));

export type CreateTargetResponseTimeAlarmCommand = import('./create-target-response-time-alarm').CreateTargetResponseTimeAlarmCommand;
export const CreateTargetResponseTimeAlarmCommand: typeof import('./create-target-response-time-alarm').CreateTargetResponseTimeAlarmCommand = null as any;
lazyLoad(exports, ['CreateTargetResponseTimeAlarmCommand'], () => require('./create-target-response-time-alarm'));

export type CreateUptimeAlarmCommand = import('./create-uptime-alarm').CreateUptimeAlarmCommand;
export const CreateUptimeAlarmCommand: typeof import('./create-uptime-alarm').CreateUptimeAlarmCommand = null as any;
lazyLoad(exports, ['CreateUptimeAlarmCommand'], () => require('./create-uptime-alarm'));
