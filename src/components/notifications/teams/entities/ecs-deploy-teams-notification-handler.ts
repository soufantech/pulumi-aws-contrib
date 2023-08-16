import { EcsDeployEvent } from '../../entities/ecs-deploy-event';
import { TeamsNotificationHandler } from './teams-notification-handler';

class EcsDeployTeamsNotificationHandler extends TeamsNotificationHandler {
    private deployColors = {
        SERVICE_DEPLOYMENT_IN_PROGRESS: '#FF8C00',
        SERVICE_DEPLOYMENT_COMPLETED: '#1f77b4',
        SERVICE_DEPLOYMENT_FAILED: '#d62728',
    };

    async processEvent(eventObject: EcsDeployEvent) {
        const resource = eventObject.resources[0];
        const title = eventObject['detail-type'];
        const description = resource;
        const color = this.deployColors[eventObject.detail.eventName];
        const status = eventObject.detail.eventName.split('_').slice(2).join('_');
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
                                color,
                            },
                        ],
                        width: 'stretch',
                    },
                    {
                        type: 'Column',
                        items: [
                            {
                                type: 'TextBlock',
                                text: `**Account:** \n\n ${accountId}`,
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
                text: `[View deployment in ECS](${referUri})`,
                wrap: true,
            },
            {
                type: 'TextBlock',
                text: `---`,
                wrap: true,
            },
        ];
    }
}

const lambda = new EcsDeployTeamsNotificationHandler(
    process.env.CHAT_WEBHOOK || '',
    process.env.KMS_KEY_ID || ''
);
export const { handle } = lambda;
