export type * as slackNotificationFunction from './slack-notification-function';
export { SlackNotificationFunction } from './slack-notification-function';

export type * as observability from './observability';
export {
    EcsAggregationDashboard,
    EcsClusterAlarm,
    EcsClusterDashboard,
    EcsServiceAlarm,
    EcsServiceDashboard,
    createAlarmWidgets,
    createSqsWidgets,
} from './observability';
