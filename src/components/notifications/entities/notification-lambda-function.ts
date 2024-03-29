import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import path from 'path';

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import * as lambda from '../../lambda';

export type NotificationLambdaFunctionInput = Omit<lambda.EncryptedFunctionArgs, 'code'> &
    Required<lambda.EncryptedFunctionArgs['handler']>;

export class NotificationLambdaFunction extends lambda.EncryptedFunction {
    protected prepareLambdaFunctionArgs(
        iamRole: aws.iam.Role,
        args: lambda.EncryptedFunctionArgs
    ): aws.lambda.FunctionArgs {
        const lambdaFunctionArgs = super.prepareLambdaFunctionArgs(iamRole, args);

        const outDir = path.join(tmpdir(), randomUUID());
        const outFile = path.join(outDir, 'index.js');
        execSync(
            `npx esbuild --platform=node --bundle --external:"@aws-sdk*" --outfile=${outFile} ${args.handler}.js`
        );

        const assetArchive = new pulumi.asset.FileArchive(outDir);

        return {
            ...lambdaFunctionArgs,
            code: assetArchive,
            handler: 'index.handle',
        };
    }

    subscribeNotificationLambdaToSnsTopic(snsTopicArn: pulumi.Input<string>) {
        const lambdaPermission = new aws.lambda.Permission(`sns-permission-${this.name}`, {
            action: 'lambda:InvokeFunction',
            function: this.lambdaFunction.name,
            principal: 'sns.amazonaws.com',
            sourceArn: snsTopicArn,
        });
        const subscription = new aws.sns.TopicSubscription(`topic-subscription-${this.name}`, {
            endpoint: this.lambdaFunction.arn,
            protocol: 'lambda',
            topic: snsTopicArn,
        });
        return {
            lambdaPermission,
            subscription,
        };
    }
}
