import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import * as iam from '../iam';

export interface RoleArgs {
    inlinePolicies: aws.types.input.iam.RoleInlinePolicy[];
    managedPolicies?: pulumi.Input<string>[];
    assumeRoleStatements?: aws.types.input.iam.GetPolicyDocumentStatementArgs[];
    maxSessionDuration?: pulumi.Input<number>;
}

export class Role extends iam.Role {
    constructor(name: string, args: RoleArgs, opts?: pulumi.CustomResourceOptions) {
        super(
            name,
            {
                path: '/ecs/',
                inlinePolicies: args.inlinePolicies,
                managedPolicies: args.managedPolicies,
                assumeRoleStatements: [
                    {
                        actions: ['sts:AssumeRole'],
                        principals: [
                            {
                                identifiers: ['ecs-tasks.amazonaws.com'],
                                type: 'Service',
                            },
                        ],
                    },
                    ...(args.assumeRoleStatements ?? []),
                ],
                maxSessionDuration: args.maxSessionDuration,
            },
            opts
        );
    }
}
