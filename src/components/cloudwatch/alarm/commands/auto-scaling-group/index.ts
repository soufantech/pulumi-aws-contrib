import lazyLoad from '../../../../../lazy-load';

export type CreateAsgMaxSizeAlarmCommand = import('./create-asg-max-size-alarm').CreateAsgMaxSizeAlarmCommand;
export const CreateAsgMaxSizeAlarmCommand: typeof import('./create-asg-max-size-alarm').CreateAsgMaxSizeAlarmCommand = null as any;
lazyLoad(exports, ['CreateAsgMaxSizeAlarmCommand'], () => require('./create-asg-max-size-alarm'));
