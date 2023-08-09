/* eslint-disable no-console */
const AWS = require('@aws-sdk/client-kms');
const https = require('https');

async function kmsDecrypt(content, key) {
    const region = process.env.KMS_REGION || '';
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

async function doRequest(body) {
    const decryptedChatWebhook = await kmsDecrypt(
        process.env.CHAT_WEBHOOK || '',
        process.env.KMS_KEY_ID || ''
    );

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    };

    return new Promise((resolve, reject) => {
        const req = https.request(decryptedChatWebhook, options, (res) => {
            if (res.statusCode === 200) resolve();
            else reject(new Error(`Request with status code ${res.statusCode}`));

            res.on('data', (data) => {
                process.stdout.write(data);
            });
        });

        req.on('error', reject);

        req.write(JSON.stringify(body));
        req.end();
    });
}

function makeMessageBlocks(eventObject) {
    const resource = eventObject.resources[0];
    const emojiDict = {
        SERVICE_DEPLOYMENT_IN_PROGRESS: ':information_source:',
        SERVICE_DEPLOYMENT_COMPLETED: ':white_check_mark:',
        SERVICE_DEPLOYMENT_FAILED: ':rotating_light:',
    };

    const title = eventObject['detail-type'];
    const description = resource;
    const status = eventObject.detail.eventName.split('_').slice(2).join('_');
    const emoji = emojiDict[eventObject.detail.eventName];
    const timestamp = eventObject.time.replace(
        /([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{2}:[0-9]{2}:[0-9]{2}).*/,
        '$1 $2 +0000'
    );
    const accountId = eventObject.account;
    const regionName = eventObject.region;
    const region = resource.split(':')[3];
    const { reason } = eventObject.detail;
    const referUri = `https://${region}.console.aws.amazon.com/ecs/v2/clusters/${
        resource.split('/')[1]
    }/services/${resource.split('/')[2]}/deployments?region=${region}`;
    const referMessage = 'View deployment in ECS';

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
                    text: `*Account:*\n${accountId}`,
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
                text: `<${referUri}|${referMessage}>`,
            },
        },
    ];
}

function processEvent(event) {
    console.log(JSON.stringify(event));

    const colorDict = {
        SERVICE_DEPLOYMENT_IN_PROGRESS: '#dbab0a',
        SERVICE_DEPLOYMENT_COMPLETED: '#1f77b4',
        SERVICE_DEPLOYMENT_FAILED: '#d62728',
    };

    const color = colorDict[event.detail.eventName];

    return {
        attachments: [
            {
                color,
                blocks: makeMessageBlocks(event),
            },
        ],
    };
}

function handler(event, context) {
    const promise = doRequest(processEvent(event));

    promise
        .then(() => context.succeed('Posted to Slack!'))
        .catch((err) => {
            console.log(err);
            context.fail('Fail to post notification to Slack');
        });
}

exports.handler = handler;
