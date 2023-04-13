import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export function bindEcsDeployEventToLambdaFunction(
    name: string,
    functionName: pulumi.Input<string>,
    resourceArn: pulumi.Input<string>
) {
    const lambdaFunction = aws.lambda.getFunctionOutput({ functionName });

    const eventDescription = 'ECS Deployment State Change';

    const eventPattern = pulumi.output(resourceArn).apply((arn) =>
        JSON.stringify({
            source: ['aws.ecs'],
            'detail-type': [eventDescription],
            resources: [arn],
        })
    );

    const rule = new aws.cloudwatch.EventRule(name, {
        description: eventDescription,
        eventPattern,
    });

    const target = new aws.cloudwatch.EventTarget(name, {
        rule: rule.name,
        arn: lambdaFunction.arn,
    });

    const permission = new aws.lambda.Permission(name, {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.functionName,
        principal: 'events.amazonaws.com',
        sourceArn: rule.arn,
    });

    return {
        rule,
        target,
        permission,
    };
}
