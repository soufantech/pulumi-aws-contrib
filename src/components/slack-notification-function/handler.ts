/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import * as AWS from '@aws-sdk/client-kms';
import * as https from 'https';

import * as aws from '@pulumi/aws';

export default (region: string) => {
    async function kmsDecrypt(content: string, key: string): Promise<string> {
        const kmsClient = new AWS.KMS({ region });

        const kmsReq = {
            CiphertextBlob: Buffer.from(content, 'base64'),
            KeyId: key,
        };

        try {
            const kmsData = await kmsClient.decrypt(kmsReq);

            const plainText = kmsData.Plaintext || new Uint8Array([]);
            return Buffer.from(plainText).toString();
        } catch (err) {
            console.log('Decrypt error:', err);
            throw err;
        }
    }

    async function doRequest(body: any) {
        const decryptedSlackWebhook = await kmsDecrypt(
            process.env.SLACK_WEBHOOK || '',
            process.env.KMS_KEY_ID || ''
        );

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        };

        return new Promise((resolve: any, reject: any) => {
            const req = https.request(decryptedSlackWebhook, options, (res: any) => {
                if (res.statusCode === 200) resolve();
                else reject(new Error(`Request with status code ${res.statusCode}`));

                res.on('data', (data: any) => {
                    process.stdout.write(data);
                });
            });

            req.on('error', reject);

            req.write(JSON.stringify(body));
            req.end();
        });
    }

    function makeMessageBlocks(messageObject: any) {
        const title = messageObject.AlarmName;
        const description = messageObject.AlarmDescription || 'No description';
        const status = messageObject.NewStateValue;
        const emoji = status === 'ALARM' ? ':rotating_light:' : ':ballot_box_with_check:';
        const timestamp = messageObject.StateChangeTime.replace(
            /([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{2}:[0-9]{2}:[0-9]{2}).*(\+[0-9]+)/,
            '$1 $2 $3'
        );
        const account = messageObject.AWSAccountId;
        const regionName = messageObject.Region;
        const reason = messageObject.NewStateReason;
        const alarmUri = `https://${
            messageObject.AlarmArn.split(':')[3]
        }.console.aws.amazon.com/cloudwatch/home#alarmsV2:alarm/${encodeURIComponent(title)}`;
        const namespace = messageObject.Trigger.Namespace;
        const metric = messageObject.Trigger.MetricName;
        const dimensions = messageObject.Trigger.Dimensions;

        return [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: title,
                    emoji: false,
                },
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'plain_text',
                        text: description,
                        emoji: false,
                    },
                ],
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Status:*\n${emoji} ${status}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Account:*\n${account}`,
                    },
                ],
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*When:*\n${timestamp}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Region:*\n${regionName}`,
                    },
                ],
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Reason:*\n> ${reason}`,
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `<${alarmUri}|View alarm in CloudWatch>`,
                },
            },
            {
                type: 'divider',
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Namespace:*\n${namespace}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Metric:*\n${metric}`,
                    },
                ],
            },
            {
                type: 'section',
                fields: dimensions.map((dimension: any) => ({
                    type: 'mrkdwn',
                    text: `*${dimension.name}:*\n${dimension.value}`,
                })),
            },
        ];
    }

    function processEvent({ Sns: snsEvent }: any) {
        if (!snsEvent) throw new Error('Empty event');
        console.log(JSON.stringify(snsEvent));

        const messageObject = JSON.parse(snsEvent.Message);

        const color = messageObject.NewStateValue === 'ALARM' ? '#d62728' : '#1f77b4';
        return {
            channel: process.env.SLACK_CHANNEL,
            attachments: [
                {
                    color,
                    blocks: makeMessageBlocks(messageObject),
                },
            ],
        };
    }

    return function handler(event: aws.sns.TopicEvent, context: any): void {
        const promises = (event.Records || []).map(processEvent).map(doRequest);

        Promise.all(promises)
            .then(() => context.succeed('Posted to Slack!'))
            .catch((err) => {
                console.log(err);
                context.fail('Fail to post notification to Slack');
            });
    };
};
