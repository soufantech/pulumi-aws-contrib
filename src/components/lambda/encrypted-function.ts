import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import { AbstractFunctionArgs, AbstractFunction } from './abstract-function';

export type EncryptedFunctionArgs = AbstractFunctionArgs & {
    kmsKey: aws.kms.Key;
    kmsAlias: aws.kms.Alias;
    encryptedEnvVars?: Record<string, pulumi.Input<string>>;
};

export class EncryptedFunction extends AbstractFunction {
    constructor(name: string, args: EncryptedFunctionArgs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:EncryptedFunction', name, args, opts);
    }

    protected prepareLambdaFunctionArgs(
        role: aws.iam.Role,
        args: EncryptedFunctionArgs
    ): aws.lambda.FunctionArgs {
        const lambdaFunctionArgs = super.prepareLambdaFunctionArgs(role, args);

        const { kmsKey, kmsAlias, encryptedEnvVars } = args;

        const envVarsCiphertext = Object.entries(encryptedEnvVars || {}).reduce(
            (acc, [key, value]) => ({
                ...acc,
                [key]: this.encrypt(kmsKey, value).ciphertextBlob,
            }),
            {}
        );

        return {
            ...lambdaFunctionArgs,
            environment: {
                ...lambdaFunctionArgs.environment,
                variables: {
                    ...args.envVars,
                    ...envVarsCiphertext,
                    KMS_KEY_ID: kmsAlias.arn,
                    KMS_REGION: args.region,
                },
            },
        };
    }

    private encrypt(kmsKey: aws.kms.Key, content: pulumi.Input<string>): aws.kms.Ciphertext {
        return new aws.kms.Ciphertext(
            this.name,
            {
                keyId: kmsKey.keyId,
                plaintext: content,
            },
            { parent: this }
        );
    }
}
