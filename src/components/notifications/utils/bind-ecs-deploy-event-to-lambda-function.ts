import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface BindEcsDeployEventToLambdaFunctionArgs {
    functionName: pulumi.Input<string>;
    resourceArn: pulumi.Input<string>;
    tags?: Record<string, pulumi.Input<string>>;
}

export class BindEcsDeployEventToLambdaFunction extends pulumi.ComponentResource {
    readonly eventRule: aws.cloudwatch.EventRule;

    readonly eventTarget: aws.cloudwatch.EventTarget;

    readonly lambdaPermission: aws.lambda.Permission;

    constructor(
        name: string,
        args: BindEcsDeployEventToLambdaFunctionArgs,
        opts?: pulumi.CustomResourceOptions
    ) {
        super('contrib:components:BindEcsDeployEventToLambdaFunction', name, {}, opts);

        const { functionName, resourceArn, tags } = args;

        const lambdaFunction = aws.lambda.getFunctionOutput({ functionName });

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
                arn: lambdaFunction.arn,
            },
            { parent: this }
        );

        const lambdaPermission = new aws.lambda.Permission(
            name,
            {
                action: 'lambda:InvokeFunction',
                function: lambdaFunction.functionName,
                principal: 'events.amazonaws.com',
                sourceArn: eventRule.arn,
            },
            { parent: this }
        );

        this.eventRule = eventRule;
        this.eventTarget = eventTarget;
        this.lambdaPermission = lambdaPermission;
    }
}
