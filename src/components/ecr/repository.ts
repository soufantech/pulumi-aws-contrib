import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export type RepositoryArgs = {
    imageTagMutability?: pulumi.Input<string>;
    forceDelete?: pulumi.Input<boolean>;
    envTags?: pulumi.Input<string>[];
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

        const envTags = args.envTags || [];

        const policy: aws.ecr.LifecyclePolicyDocument = {
            rules: [
                ...envTags.map(
                    (envTag, index): aws.ecr.PolicyRule => ({
                        rulePriority: (index + 1) * 10,
                        description: `${envTag} images`,
                        selection: {
                            tagStatus: 'tagged',
                            tagPrefixList: [`${envTag}-`],
                            countType: 'imageCountMoreThan',
                            countNumber: 3,
                        },
                        action: { type: 'expire' },
                    })
                ),
                {
                    rulePriority: (envTags.length + 1) * 10,
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
            { ...opts, parent: this.ecrRepository }
        );
    }
}
