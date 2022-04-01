export type { slackNotificationFunction } from './slack-notification-function';
export { SlackNotificationFunction } from './slack-notification-function';

export type {
    ecsAggregationDashboard,
    ecsClusterAlarm,
    ecsClusterDashboard,
    ecsServiceAlarm,
    ecsServiceDashboard,
} from './observability';
export type { observability } from './observability';
export {
    EcsAggregationDashboard,
    EcsClusterAlarm,
    EcsClusterDashboard,
    EcsServiceAlarm,
    EcsServiceDashboard,
} from './observability';
export { createAlarmWidgets, createSqsWidgets } from './observability';
