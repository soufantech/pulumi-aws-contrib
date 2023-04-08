import path from 'path';

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface SlackAlarmNotificationArgs {
    region: pulumi.Input<string>,
    accountId: pulumi.Input<string>,
    chatWebhook: pulumi.Input<string>;
    kmsDeletionWindow?: pulumi.Input<number>;
    logGroupRetentionDays?: pulumi.Input<number>;
    tags?: Record<string, string>;
}

export class SlackAlarmNotification extends pulumi.ComponentResource {
    readonly role: aws.iam.Role;

    readonly kmsKey: aws.kms.Key;

    readonly kmsAlias: aws.kms.Alias;

    readonly lambdaFunction: aws.lambda.CallbackFunction<aws.sns.TopicEvent, unknown>;

    readonly logGroup: aws.cloudwatch.LogGroup;

    readonly snsTopic: aws.sns.Topic;

    readonly snsTopicEventSubscription: aws.sns.TopicEventSubscription;

    constructor(name: string, args: SlackAlarmNotificationArgs, opts?: pulumi.ResourceOptions) {
        super('contrib:components:SlackNotificationFunction', name, {}, opts);

        const { region, accountId, chatWebhook, tags } = args;
        const kmsDeletionWindow = args.kmsDeletionWindow || 7;
        const logGroupRetentionDays = args.logGroupRetentionDays || 14;

        const role = this.createRole(name, region, accountId, tags);

        const { kmsKey, kmsAlias } = this.createKmsKey(
            name,
            accountId,
            role,
            kmsDeletionWindow,
            tags
        );

        const chatWebhookCiphertext = this.encrypt(name, kmsKey, chatWebhook);

        const lambdaFunction = this.createLambdaFunction(
            name,
            region,
            role,
            chatWebhookCiphertext,
            kmsAlias,
            tags
        );

        const logGroup = this.createLogGroup(name, lambdaFunction, logGroupRetentionDays, tags);

        const snsTopic = this.createSnsTopic(name, tags);

        const snsTopicEventSubscription = SlackAlarmNotification.subscribeLambdaFunctionOnSnsTopic(
            name,
            lambdaFunction,
            snsTopic
        );

        this.role = role;
        this.kmsKey = kmsKey;
        this.kmsAlias = kmsAlias;
        this.lambdaFunction = lambdaFunction;
        this.logGroup = logGroup;
        this.snsTopic = snsTopic;
        this.snsTopicEventSubscription = snsTopicEventSubscription;
    }

    private createRole(
        name: string,
        region: pulumi.Input<string>,
        accountId: pulumi.Input<string>,
        tags?: Record<string, string>
    ): aws.iam.Role {
        const logGroupPolicy = aws.iam.getPolicyDocumentOutput(
            {
                statements: [
                    {
                        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                        resources: [
                            pulumi.interpolate`arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/${name}-*:*`,
                        ],
                    },
                ],
            },
            { parent: this }
        );

        const kmsPolicy = aws.iam.getPolicyDocumentOutput(
            {
                statements: [
                    {
                        actions: ['kms:Decrypt'],
                        resources: [
                            pulumi.interpolate`arn:aws:kms:${region}:${accountId}:alias/${name}`,
                        ],
                    },
                ],
            },
            { parent: this }
        );

        return new aws.iam.Role(
            name,
            {
                name, // It was necessary because of kms key policy
                assumeRolePolicy: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                Service: 'lambda.amazonaws.com',
                            },
                            Action: 'sts:AssumeRole',
                        },
                    ],
                },
                inlinePolicies: [
                    {
                        name: 'log-group',
                        policy: logGroupPolicy.json,
                    },
                    {
                        name: 'kms',
                        policy: kmsPolicy.json,
                    },
                ],
                tags,
            },
            { parent: this }
        );
    }

    private createKmsKey(
        name: string,
        accountId: pulumi.Input<string>,
        role: aws.iam.Role,
        kmsDeletionWindow: pulumi.Input<number>,
        tags?: Record<string, string>
    ): { kmsKey: aws.kms.Key; kmsAlias: aws.kms.Alias } {
        const kmsKeyPolicy = aws.iam.getPolicyDocumentOutput(
            {
                statements: [
                    {
                        principals: [
                            {
                                type: 'AWS',
                                identifiers: [pulumi.interpolate`arn:aws:iam::${accountId}:root`],
                            },
                        ],
                        actions: ['*'],
                        resources: ['*'],
                    },
                    {
                        principals: [
                            {
                                type: 'AWS',
                                identifiers: [
                                    pulumi.interpolate`arn:aws:iam::${accountId}:role/${name}`,
                                ],
                            },
                        ],
                        actions: ['kms:Decrypt', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
                        resources: ['*'],
                        conditions: [
                            {
                                test: 'StringEquals',
                                variable: 'kms:RequestAlias',
                                values: [`alias/${name}`],
                            },
                        ],
                    },
                ],
            },
            { parent: this }
        );

        const kmsKey = new aws.kms.Key(
            name,
            {
                deletionWindowInDays: kmsDeletionWindow,
                policy: kmsKeyPolicy.json,
                tags,
            },
            { dependsOn: [role], parent: this }
        );

        const kmsAlias = new aws.kms.Alias(
            name,
            {
                name: `alias/${name}`,
                targetKeyId: kmsKey.keyId,
            },
            { parent: this }
        );

        return { kmsKey, kmsAlias };
    }

    private encrypt(
        name: string,
        kmsKey: aws.kms.Key,
        content: pulumi.Input<string>
    ): aws.kms.Ciphertext {
        return new aws.kms.Ciphertext(
            name,
            {
                keyId: kmsKey.keyId,
                plaintext: content,
            },
            { parent: this }
        );
    }

    private createLambdaFunction(
        name: string,
        region: pulumi.Input<string>,
        role: aws.iam.Role,
        slackWebhookCiphertext: aws.kms.Ciphertext,
        kmsAlias: aws.kms.Alias,
        tags?: Record<string, string>
    ): aws.lambda.Function {
        const directory = path.join(__dirname, '/function');
        // const file = path.join(__dirname, 'function', 'index.js');
        const handler = 'index.handler';

        // const assetArchive = new pulumi.asset.AssetArchive({
        //     '.': new pulumi.asset.FileArchive(directory),
        // });
        const assetArchive = new pulumi.asset.FileArchive(directory);
        // const assetArchive = new pulumi.asset.FileAsset(file);

        return new aws.lambda.Function(
            name,
            {
                runtime: 'nodejs18.x',
                timeout: 60,
                role: role.arn,
                code: assetArchive,
                handler,
                environment: {
                    variables: {
                        SLACK_WEBHOOK: slackWebhookCiphertext.ciphertextBlob,
                        KMS_KEY_ID: kmsAlias.arn,
                        KMS_REGION: region,
                    },
                },
                tags,
            },
            { parent: this }
        );
    }

    private createLogGroup(
        name: string,
        lambdaFunction: aws.lambda.CallbackFunction<aws.sns.TopicEvent, unknown>,
        logGroupRetentionDays: pulumi.Input<number>,
        tags?: Record<string, string>
    ): aws.cloudwatch.LogGroup {
        return new aws.cloudwatch.LogGroup(
            `/aws/lambda/${name}`,
            {
                name: pulumi.interpolate`/aws/lambda/${lambdaFunction.name}`,
                retentionInDays: logGroupRetentionDays,
                tags,
            },
            { parent: this }
        );
    }

    private createSnsTopic(name: string, tags?: Record<string, string>): aws.sns.Topic {
        return new aws.sns.Topic(name, { tags }, { parent: this });
    }

    private static subscribeLambdaFunctionOnSnsTopic(
        name: string,
        lambdaFunction: aws.lambda.CallbackFunction<aws.sns.TopicEvent, unknown>,
        snsTopic: aws.sns.Topic
    ): aws.sns.TopicEventSubscription {
        return snsTopic.onEvent(name, lambdaFunction);
    }
}
