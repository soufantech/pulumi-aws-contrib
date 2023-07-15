const { TEAMS_WEBHOOK } = process.env;

function makeMessageBlocks(messageObject) {
    const alarmColor = {
        OK: 'good',
        ALARM: 'attention',
    };

    const title = messageObject.AlarmName;
    const description = messageObject.AlarmDescription || 'No description';
    const status = messageObject.NewStateValue;
    const colorStatus = alarmColor[status];
    const timestamp = messageObject.StateChangeTime?.replace(
        /([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{2}:[0-9]{2}:[0-9]{2}).*(\+[0-9]+)/,
        '$1 $2 $3'
    );
    const account = messageObject.AWSAccountId;
    const regionName = messageObject.Region;
    const reason = messageObject.NewStateReason;
    const alarmUri = `https://${
        messageObject.AlarmArn?.split(':')[3]
    }.console.aws.amazon.com/cloudwatch/home#alarmsV2:alarm/${encodeURIComponent(title)}`;
    const namespace = messageObject.Trigger.Namespace;
    const metric = messageObject.Trigger.MetricName;
    const dimensions = messageObject.Trigger.Dimensions;

    return [
        {
            type: 'TextBlock',
            size: 'Medium',
            weight: 'Bolder',
            text: title,
        },
        {
            type: 'TextBlock',
            spacing: 'None',
            text: description,
            isSubtle: true,
        },
        {
            type: 'ColumnSet',
            columns: [
                {
                    type: 'Column',
                    items: [
                        {
                            type: 'TextBlock',
                            text: `**Status:** \n\n ${status}`,
                            color: colorStatus,
                        },
                    ],
                    width: 'stretch',
                },
                {
                    type: 'Column',
                    items: [
                        {
                            type: 'TextBlock',
                            text: `**Account:** \n\n ${account}`,
                        },
                    ],
                    width: 'stretch',
                },
            ],
        },
        {
            type: 'ColumnSet',
            columns: [
                {
                    type: 'Column',
                    items: [
                        {
                            type: 'TextBlock',
                            text: `**When:**\n\n${timestamp}`,
                        },
                    ],
                    width: 'stretch',
                },
                {
                    type: 'Column',
                    items: [
                        {
                            type: 'TextBlock',
                            text: `**Region:**\n\n${regionName}`,
                        },
                    ],
                    width: 'stretch',
                },
            ],
        },
        {
            type: 'TextBlock',
            text: `**Reason:** \n\n ${reason}`,
            wrap: true,
        },
        {
            type: 'TextBlock',
            text: `[View alarm in CloudWatch](${alarmUri})`,
            wrap: true,
        },
        {
            type: 'TextBlock',
            text: `---`,
            wrap: true,
        },
        {
            type: 'ColumnSet',
            columns: [
                {
                    type: 'Column',
                    items: [
                        {
                            type: 'TextBlock',
                            text: `**Namespace:**\n\n${namespace}`,
                        },
                    ],
                    width: 'stretch',
                },
                {
                    type: 'Column',
                    items: [
                        {
                            type: 'TextBlock',
                            text: `**Metric:**\n\n${metric}`,
                        },
                    ],
                    width: 'stretch',
                },
            ],
        },
        {
            type: 'ColumnSet',
            columns: dimensions.map((dimension) => ({
                type: 'Column',
                items: [
                    {
                        type: 'TextBlock',
                        text: `**${dimension.name}:** \n ${dimension.value}`,
                    },
                ],
                width: 'stretch',
            })),
        },
    ];
}

const postMessageToTeams = async (message) => {
    const messageObject = JSON.parse(message);
    const messageBody = makeMessageBlocks(messageObject);
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

    try {
        console.log('Sending message to Teams...');
        const response = await fetch(TEAMS_WEBHOOK, {
            method: 'POST',
            data: JSON.stringify(card),
            headers: {
                'content-type': 'application/vnd.microsoft.teams.card.o365connector',
            },
        });

        let { data } = response;
        const { status, statusText } = response;
        let result = `${status} - ${statusText}`;
        data = data.toString();

        if (data.includes('Microsoft Teams endpoint returned HTTP error')) {
            result += ` - Error: ${data}`;
        }

        return result;
    } catch (err) {
        return err;
    }
};

const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const message = event.Records[0].Sns.Message;
    console.log('Message received From SNS:', message);

    const teamsResponse = await postMessageToTeams(message);

    const functionResponse = {
        message,
        teamsResponse,
    };

    console.log(JSON.stringify(functionResponse, null, 2));
    console.log('Done!');
    return functionResponse;
};

exports.handler = handler;
