import path from 'path';

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import * as lambda from '../../lambda';

export class NotificationLambdaFunction extends lambda.EncryptedFunction {
    readonly snsTopic: aws.sns.Topic;

    readonly snsTopicEventSubscription: aws.sns.TopicEventSubscription;

    constructor(name: string, args: lambda.EncryptedFunctionArgs, opts?: pulumi.ResourceOptions) {
        super(name, args, opts);
        aws.sns.getTopic({
            name,
        });
        const snsTopic = this.createSnsTopic(name, args.tags);

        const snsTopicEventSubscription =
            NotificationLambdaFunction.subscribeLambdaFunctionOnSnsTopic(
                name,
                this.lambdaFunction,
                snsTopic
            );

        this.snsTopic = snsTopic;
        this.snsTopicEventSubscription = snsTopicEventSubscription;
    }

    protected prepareLambdaFunctionArgs(
        iamRole: aws.iam.Role,
        args: lambda.EncryptedFunctionArgs
    ): aws.lambda.FunctionArgs {
        const lambdaFunctionArgs = super.prepareLambdaFunctionArgs(iamRole, args);

        const directory = path.join(__dirname, '/function');
        const handler = 'index.handler';
        const assetArchive = new pulumi.asset.FileArchive(directory);

        return {
            ...lambdaFunctionArgs,
            code: assetArchive,
            handler,
        };
    }

    private createSnsTopic(name: string, tags?: Record<string, string>): aws.sns.Topic {
        return new aws.sns.Topic(name, { tags }, { parent: this });
    }

    private static subscribeLambdaFunctionOnSnsTopic(
        name: string,
        lambdaFunction: aws.lambda.Function,
        snsTopic: aws.sns.Topic
    ): aws.sns.TopicEventSubscription {
        return snsTopic.onEvent(name, lambdaFunction);
    }
}
