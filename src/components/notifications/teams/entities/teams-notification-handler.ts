import { NotificationLambdaHandler } from '../../entities/notification-lambda-handler';

export abstract class TeamsNotificationHandler extends NotificationLambdaHandler {
    constructor(protected encryptedWebhook: string) {
        super();
    }

    async sendNotification(messageBody: unknown) {
        console.debug('[DEBUG]:Sending message to Teams...');

        const card = {
            type: 'message',
            attachments: [
                {
                    contentType: 'application/vnd.microsoft.card.adaptive',
                    contentUrl: null,
                    content: {
                        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                        type: 'AdaptiveCard',
                        version: '1.0',
                        body: messageBody,
                    },
                },
            ],
        };

        const response = await fetch(await this.kmsDecrypt(this.encryptedWebhook, ''), {
            method: 'POST',
            body: JSON.stringify(card),
            headers: {
                'content-type': 'application/vnd.microsoft.teams.card.o365connector',
            },
        });

        const responseBody = await response.text();
        if (!response.ok || responseBody.includes('Microsoft Teams endpoint returned HTTP error')) {
            const { status, statusText } = response;
            throw new Error(`TEAMS_ERROR: ${status} - ${statusText} - ${responseBody}`);
        }
    }

    abstract processEvent(event: unknown): Promise<unknown>;
}
