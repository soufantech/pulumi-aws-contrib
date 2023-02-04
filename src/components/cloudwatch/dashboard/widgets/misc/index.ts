import lazyLoad from '../../../../../lazy-load';

export const createAlarmWidgets: typeof import('./create-alarm-widgets').createAlarmWidgets = null as any;
lazyLoad(exports, ['createAlarmWidgets'], () => require('./create-alarm-widgets'));

export const createSqsWidgets: typeof import('./create-sqs-widgets').createSqsWidgets = null as any;
lazyLoad(exports, ['createSqsWidgets'], () => require('./create-sqs-widgets'));
