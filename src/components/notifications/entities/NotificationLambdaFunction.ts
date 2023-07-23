import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import path from 'path';

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import * as lambda from '../../lambda';

export interface NotificationLambdaFunctionInput
    extends Omit<lambda.EncryptedFunctionArgs, 'code'> {
    codePath: string;
    handler: string;
}

export class NotificationLambdaFunction extends lambda.EncryptedFunction {
    private codePath: string;

    private handler: string;

    constructor(
        name: string,
        { handler, codePath, ...args }: NotificationLambdaFunctionInput,
        opts?: pulumi.ResourceOptions
    ) {
        super(name, args, opts);
        this.codePath = codePath;
        this.handler = handler;
    }

    protected prepareLambdaFunctionArgs(
        iamRole: aws.iam.Role,
        args: lambda.EncryptedFunctionArgs
    ): aws.lambda.FunctionArgs {
        const lambdaFunctionArgs = super.prepareLambdaFunctionArgs(iamRole, args);

        const directory = path.join(tmpdir(), randomUUID());
        execSync(`npx tsc --outDir ${directory} ${this.codePath}`);

        const assetArchive = new pulumi.asset.FileArchive(directory);

        return {
            ...lambdaFunctionArgs,
            code: assetArchive,
            handler: this.handler,
        };
    }

    subscribeNotificationLambdaToSnsTopic(snsTopic: aws.sns.Topic): aws.sns.TopicEventSubscription {
        return snsTopic.onEvent(this.name, this.lambdaFunction);
    }
}
