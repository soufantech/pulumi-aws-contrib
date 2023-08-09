import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface BindEcsDeployEventToSnsTopicArgs {
    topicName: pulumi.Input<string>;
    resourceArn: pulumi.Input<string>;
    tags?: Record<string, pulumi.Input<string>>;
}

export class BindEcsDeployEventToSnsTopic extends pulumi.ComponentResource {
    readonly eventRule: aws.cloudwatch.EventRule;

    readonly eventTarget: aws.cloudwatch.EventTarget;

    constructor(
        name: string,
        args: BindEcsDeployEventToSnsTopicArgs,
        opts?: pulumi.ComponentResourceOptions
    ) {
        super('contrib:components:BindEcsDeployEventToSnsTopic', name, {}, opts);

        const { topicName, resourceArn, tags } = args;

        const snsTopic = aws.sns.getTopicOutput({ name: topicName });

        const eventDescription = 'ECS Deployment State Change';
        const eventPattern = pulumi.output(resourceArn).apply((arn) =>
            JSON.stringify({
                source: ['aws.ecs'],
                'detail-type': [eventDescription],
                resources: [arn],
            })
        );

        const eventRule = new aws.cloudwatch.EventRule(
            name,
            {
                description: eventDescription,
                eventPattern,
                tags,
            },
            { parent: this }
        );

        const eventTarget = new aws.cloudwatch.EventTarget(
            name,
            {
                rule: eventRule.name,
                arn: snsTopic.arn,
            },
            { parent: this }
        );

        this.eventRule = eventRule;
        this.eventTarget = eventTarget;
    }
}
