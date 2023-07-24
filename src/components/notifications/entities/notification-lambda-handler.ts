import { KMS } from '@aws-sdk/client-kms';

import { SnsEvent } from './sns-event';

export abstract class NotificationLambdaHandler {
    constructor() {
        this.handle = this.handle.bind(this);
    }

    // eslint-disable-next-line
    protected async kmsDecrypt(content: string, key: string) {
        const region = process.env.KMS_REGION || '';
        const kmsClient = new KMS({ region });
        const kmsReq = {
            CiphertextBlob: Buffer.from(content, 'base64'),
            KeyId: key,
        };
        const kmsData = await kmsClient.decrypt(kmsReq);
        const plainText = kmsData.Plaintext || new Uint8Array([]);
        return Buffer.from(plainText).toString();
    }

    abstract sendNotification(message: unknown): Promise<void>;
    abstract processEvent(event: unknown): Promise<unknown>;

    async handle(event: SnsEvent) {
        console.info('[INFO]:Received event:', JSON.stringify(event));
        try {
            const notifications = await Promise.all(
                event.Records.map((evRecord) => this.processEvent(JSON.parse(evRecord.Sns.Message)))
            );
            console.debug(`[DEBUG]:Sending ${notifications.length} msgs`);
            await Promise.all(notifications.map((message) => this.sendNotification(message)));
            console.info('[INFO]:Done!');
        } catch (error) {
            if (error instanceof Error) {
                console.error(`[ERROR]:${error.message}`);
            }
            throw error;
        }
    }
}
