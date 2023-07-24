import { resolve } from 'path';

import { NotificationLambdaFunction } from '../../entities/notification-lambda-function';

type Input = ConstructorParameters<typeof NotificationLambdaFunction>;

export class TeamsNotificationFactory {
    static createAlarmNotificationLambda(
        name: Input[0],
        args: Omit<Input[1], 'codePath' | 'handler'>
    ) {
        return new NotificationLambdaFunction(name, {
            ...args,
            codePath: resolve(__dirname, '..', 'entities', 'alarm-teams-notification-handler.ts'),
            handler: 'alarm-teams-notification-handler.handle',
        });
    }

    static createEcsDeployNotificationLambda(
        name: Input[0],
        args: Omit<Input[1], 'codePath' | 'handler'>
    ) {
        return new NotificationLambdaFunction(name, {
            ...args,
            codePath: resolve(
                __dirname,
                '..',
                'entities',
                'ecs-deploy-teams-notification-handler.ts'
            ),
            handler: 'ecs-deploy-teams-notification-handler.handle',
        });
    }
}
