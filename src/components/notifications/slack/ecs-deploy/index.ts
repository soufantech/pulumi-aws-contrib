import path from 'path';

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import * as lambda from '../../../lambda';

export class EcsDeployNotification extends lambda.EncryptedFunction {
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
}
