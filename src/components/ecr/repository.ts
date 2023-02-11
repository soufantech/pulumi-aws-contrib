import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export type RepositoryArgs = {
    imageTagMutability?: pulumi.Input<string>;
    forceDelete?: pulumi.Input<boolean>;
    tagPrefixes?: pulumi.Input<string>[];
    tagRetention?: pulumi.Input<number>;
    tags?: Record<string, pulumi.Input<string>>;
};

export class Repository {
    readonly ecrRepository: aws.ecr.Repository;

    readonly ecrLifecyclePolicy: aws.ecr.LifecyclePolicy;

    constructor(name: string, args: RepositoryArgs, opts?: pulumi.CustomResourceOptions) {
        this.ecrRepository = new aws.ecr.Repository(
            name,
            {
                name,
                encryptionConfigurations: [
                    {
                        encryptionType: 'AES256',
                    },
                ],
                imageScanningConfiguration: {
                    scanOnPush: true,
                },
                imageTagMutability: args.imageTagMutability || 'IMMUTABLE',
                forceDelete: args.forceDelete || true,
                tags: args.tags,
            },
            opts
        );

        const tagPrefixes = args.tagPrefixes || [];

        const policy: aws.ecr.LifecyclePolicyDocument = {
            rules: [
                ...tagPrefixes.map(
                    (tagPrefix, index): aws.ecr.PolicyRule => ({
                        rulePriority: (index + 1) * 10,
                        description: `${tagPrefix} images`,
                        selection: {
                            tagStatus: 'tagged',
                            tagPrefixList: [`${tagPrefix}-`],
                            countType: 'imageCountMoreThan',
                            countNumber: args.tagRetention || 3,
                        },
                        action: { type: 'expire' },
                    })
                ),
                {
                    rulePriority: (tagPrefixes.length + 1) * 10,
                    selection: {
                        tagStatus: 'untagged',
                        countType: 'imageCountMoreThan',
                        countNumber: 2,
                    },
                    action: { type: 'expire' },
                },
            ],
        };

        this.ecrLifecyclePolicy = new aws.ecr.LifecyclePolicy(
            name,
            {
                repository: this.ecrRepository.name,
                policy,
            },
            {
                ...opts,
                parent: this.ecrRepository,
                replaceOnChanges: [''],
            }
        );
    }
}
