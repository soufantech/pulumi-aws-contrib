import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface KeyArgs {
    keyAlias?: pulumi.Input<string>;
    kmsDeletionWindow?: pulumi.Input<number>;
    tags?: Record<string, string>;
}

export class Key extends pulumi.ComponentResource {
    readonly kmsKey: aws.kms.Key;

    readonly kmsAlias: aws.kms.Alias;

    private name: string;

    private defaultPolicyStatement: aws.types.input.iam.GetPolicyDocumentStatementArgs = {};

    constructor(name: string, args: KeyArgs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:Key', name, {}, opts);

        const alias = args.keyAlias || `alias/${name}`;
        const kmsDeletionWindow = args.kmsDeletionWindow || 7;

        const kmsKey = new aws.kms.Key(
            name,
            {
                deletionWindowInDays: kmsDeletionWindow,
                tags: args.tags,
            },
            { parent: this }
        );

        const kmsAlias = new aws.kms.Alias(
            name,
            {
                name: alias,
                targetKeyId: kmsKey.keyId,
            },
            { parent: this }
        );

        this.name = name;
        this.kmsKey = kmsKey;
        this.kmsAlias = kmsAlias;

        const { accountId } = pulumi.output(aws.getCallerIdentity());
        this.setDefaultPolicyStatement(accountId);
    }

    /**
     * @deprecated The method should not be used
     */
    createKeyPolicy(name: string, accountId: pulumi.Input<string>, roles: aws.iam.Role[]) {
        const policy = aws.iam.getPolicyDocumentOutput(
            {
                statements: [
                    {
                        principals: [
                            {
                                type: 'AWS',
                                identifiers: [pulumi.interpolate`arn:aws:iam::${accountId}:root`],
                            },
                        ],
                        actions: ['kms:*'],
                        resources: ['*'],
                    },
                    {
                        principals: [
                            {
                                type: 'AWS',
                                identifiers: roles.map((role) => role.arn),
                            },
                        ],
                        actions: ['kms:Decrypt', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
                        resources: ['*'],
                        conditions: [
                            {
                                test: 'StringEquals',
                                variable: 'kms:RequestAlias',
                                values: [this.kmsAlias.name],
                            },
                        ],
                    },
                ],
            },
            { parent: this }
        );

        return new aws.kms.KeyPolicy(
            name,
            {
                keyId: this.kmsKey.keyId,
                policy: policy.json,
            },
            { parent: this, dependsOn: [...roles] }
        );
    }

    setDefaultPolicyStatement(accountId: pulumi.Input<string>) {
        this.defaultPolicyStatement = {
            principals: [
                {
                    type: 'AWS',
                    identifiers: [pulumi.interpolate`arn:aws:iam::${accountId}:root`],
                },
            ],
            actions: ['kms:*'],
            resources: ['*'],
        };
    }

    setKeyPolicy(policy: pulumi.Output<aws.iam.GetPolicyDocumentResult>) {
        return new aws.kms.KeyPolicy(
            this.name,
            {
                keyId: this.kmsKey.keyId,
                policy: policy.json,
            },
            { parent: this }
        );
    }

    allowRolesUseKeyToDecrypt(rolesArns: pulumi.Input<string>[]) {
        const policy = aws.iam.getPolicyDocumentOutput(
            {
                statements: [
                    this.defaultPolicyStatement,
                    {
                        principals: [
                            {
                                type: 'AWS',
                                identifiers: rolesArns,
                            },
                        ],
                        actions: ['kms:Decrypt', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
                        resources: ['*'],
                        conditions: [
                            {
                                test: 'StringEquals',
                                variable: 'kms:RequestAlias',
                                values: [this.kmsAlias.name],
                            },
                        ],
                    },
                ],
            },
            { parent: this }
        );

        return this.setKeyPolicy(policy);
    }

    allowOrganizationsUseKey(organizationIds: pulumi.Input<string>[]) {
        const policy = aws.iam.getPolicyDocumentOutput(
            {
                statements: [
                    this.defaultPolicyStatement,
                    {
                        principals: [
                            {
                                type: 'AWS',
                                identifiers: ['*'],
                            },
                        ],
                        actions: [
                            'kms:Describe*',
                            'kms:List*',
                            'kms:Get*',
                            'kms:Encrypt',
                            'kms:Decrypt',
                            'kms:ReEncrypt*',
                            'kms:GenerateDataKey*',
                        ],
                        resources: ['*'],
                        conditions: [
                            {
                                test: 'ForAnyValue:StringEquals',
                                variable: 'aws:PrincipalOrgID',
                                values: organizationIds,
                            },
                        ],
                    },
                ],
            },
            { parent: this }
        );

        return this.setKeyPolicy(policy);
    }
}
