import lazyLoad from '../../../../../lazy-load';

export const createLatencyAndRequestCountWidgets: typeof import('./create-latency-and-request-count-widgets').createLatencyAndRequestCountWidgets = null as any;
lazyLoad(exports, ['createLatencyAndRequestCountWidgets'], () => require('./create-latency-and-request-count-widgets'));

export const createUptimeAndHealthyWidgets: typeof import('./create-uptime-and-healthy-widgets').createUptimeAndHealthyWidgets = null as any;
lazyLoad(exports, ['createUptimeAndHealthyWidgets'], () => require('./create-uptime-and-healthy-widgets'));
