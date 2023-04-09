import * as pulumi from '@pulumi/pulumi';

import * as iam from '../iam';

export type RoleArgs = Omit<iam.RoleArgs, 'path'>;

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
                tags: args.tags,
            },
            opts
        );
    }
}

export function createEcsRole(
    name: string,
    args: RoleArgs,
    opts?: pulumi.CustomResourceOptions
): iam.Role {
    const assumeRoleStatements = [
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
    ];

    return new iam.Role(
        name,
        {
            ...args,
            path: '/ecs/',
            assumeRoleStatements,
        },
        opts
    );
}
