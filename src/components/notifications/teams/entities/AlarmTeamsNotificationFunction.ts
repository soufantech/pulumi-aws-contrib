import { NotificationLambdaHandler } from '../../entities/NotificationLambdaHandler';
import { TeamsNotificationFunction } from './TeamsNotificationFunction';

export abstract class AlarmTeamsNotificationFunction extends TeamsNotificationFunction {
    async processEvent(event: { Body: string }) {}
}
