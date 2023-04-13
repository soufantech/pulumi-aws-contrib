import * as pulumi from '@pulumi/pulumi';

import * as iam from '../iam';

export type CreateEcsRoleArgs = Omit<iam.RoleArgs, 'path'>;

export function createEcsRole(
    name: string,
    args: CreateEcsRoleArgs,
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
