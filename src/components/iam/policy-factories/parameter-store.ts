import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface CreateParameterStorePolicyArgs {
    parameterPaths: pulumi.Input<string>[];
    kmsKey: pulumi.Input<string>;
}

export function createParameterStorePolicy(
    region: pulumi.Input<string>,
    accountId: pulumi.Input<string>,
    args: CreateParameterStorePolicyArgs
): pulumi.Output<aws.iam.GetPolicyDocumentResult> {
    return aws.iam.getPolicyDocumentOutput({
        statements: [
            {
                actions: [
                    'ssm:GetParameter',
                    'ssm:GetParameters',
                    'ssm:GetParametersByPath',
                    'ssm:GetParameterHistory',
                ],
                resources: args.parameterPaths.map(
                    (path) =>
                        pulumi.interpolate`arn:aws:ssm:${region}:${accountId}:parameter/${path}`
                ),
            },
            {
                actions: ['kms:Decrypt', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
                resources: ['*'],
                conditions: [
                    {
                        test: 'ForAnyValue:StringLike',
                        variable: 'kms:ResourceAliases',
                        values: [args.kmsKey],
                    },
                ],
            },
        ],
    });
}
