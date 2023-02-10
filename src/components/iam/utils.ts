import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export function createAssumeRolePolicyForUser(
    name: pulumi.Input<string>,
    accountId: pulumi.Input<string>,
    path?: pulumi.Input<string>
): aws.types.input.iam.GetPolicyDocumentStatementArgs[] {
    const userName = path ? pulumi.interpolate`${path}/${name}` : name;

    return [
        {
            actions: ['sts:AssumeRole'],
            principals: [
                {
                    identifiers: [pulumi.interpolate`arn:aws:iam::${accountId}:user/${userName}`],
                    type: 'AWS',
                },
            ],
        },
        {
            actions: ['sts:TagSession'],
            principals: [
                {
                    identifiers: [pulumi.interpolate`arn:aws:iam::${accountId}:user/${userName}`],
                    type: 'AWS',
                },
            ],
        },
    ];
}

export function createManagedPolicyArn(
    name: pulumi.Input<string>,
    path?: pulumi.Input<string>
): pulumi.Output<string> {
    const policyName = path ? pulumi.interpolate`${path}/${name}` : name;
    return pulumi.interpolate`arn:aws:iam::aws:policy/${policyName}`;
}
