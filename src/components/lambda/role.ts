import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import * as iam from '../iam';

export type CreateLambdaRoleArgs = Omit<iam.RoleArgs, 'path'> & {
    accountId: pulumi.Input<string>;
    region: pulumi.Input<string>;
};

export function createLambdaRole(
    name: string,
    args: CreateLambdaRoleArgs,
    opts?: pulumi.CustomResourceOptions
): iam.Role {
    const { accountId, region } = args;

    const inlinePolicies = [
        {
            name: 'log-group',
            policy: aws.iam.getPolicyDocumentOutput({
                statements: [
                    {
                        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                        resources: [
                            pulumi.interpolate`arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/${name}-*:*`,
                        ],
                    },
                ],
            }).json,
        },
        ...(args.inlinePolicies ?? []),
    ];

    const assumeRoleStatements = [
        {
            actions: ['sts:AssumeRole'],
            principals: [
                {
                    identifiers: ['lambda.amazonaws.com'],
                    type: 'Service',
                },
            ],
        },
        ...(args.assumeRoleStatements ?? []),
    ];

    return new iam.Role(
        name,
        {
            ...args,
            path: '/lambda/',
            inlinePolicies,
            assumeRoleStatements,
        },
        opts
    );
}
