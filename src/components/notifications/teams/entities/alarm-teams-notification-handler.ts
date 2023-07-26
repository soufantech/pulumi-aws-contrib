import { AlarmEvent } from '../../entities/alarm-event';
import { TeamsNotificationHandler } from './teams-notification-handler';

class AlarmTeamsNotificationHandler extends TeamsNotificationHandler {
    private alarmColor = {
        OK: 'good',
        ALARM: 'attention',
    };

    async processEvent(messageObject: AlarmEvent) {
        const title = messageObject.AlarmName;
        const description = messageObject.AlarmDescription || 'No description';
        const colorStatus = this.alarmColor[messageObject.NewStateValue];
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
                                text: `**Status:** \n\n ${messageObject.NewStateValue}`,
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
}

const lambda = new AlarmTeamsNotificationHandler(
    process.env.CHAT_WEBHOOK || '',
    process.env.KMS_KEY_ID || ''
);
export const { handle } = lambda;
