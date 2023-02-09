import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface RoleArgs {
    inlinePolicies?: aws.types.input.iam.RoleInlinePolicy[];
    managedPolicies?: pulumi.Input<string>[];
    assumeRoleStatements?: aws.types.input.iam.GetPolicyDocumentStatementArgs[];
    maxSessionDuration?: pulumi.Input<number>;
    path?: pulumi.Input<string>;
    tags?: Record<string, pulumi.Input<string>>;
}

export class Role {
    readonly role: aws.iam.Role;

    constructor(name: string, args: RoleArgs, opts?: pulumi.CustomResourceOptions) {
        const assumeRoleStatements = args.assumeRoleStatements ?? [];

        const assumeRolePolicy = aws.iam.getPolicyDocumentOutput({
            statements: [...assumeRoleStatements],
        });

        this.role = new aws.iam.Role(
            name,
            {
                name,
                path: args.path,
                assumeRolePolicy: assumeRolePolicy.json,
                inlinePolicies: args.inlinePolicies,
                managedPolicyArns: args.managedPolicies,
                maxSessionDuration: args.maxSessionDuration ?? 3600,
                tags: args.tags,
            },
            {
                deleteBeforeReplace: true,
                ...opts,
            }
        );
    }
}
