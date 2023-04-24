import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import { createLambdaRole, CreateLambdaRoleArgs } from './role';

export interface AbstractFunctionArgs {
    region: pulumi.Input<string>;
    accountId: pulumi.Input<string>;
    inlinePolicies?: aws.types.input.iam.RoleInlinePolicy[],
    managedPolicies?: pulumi.Input<string>[],
    code?: pulumi.asset.Archive;
    handler?: pulumi.Input<string>;
    envVars?: Record<string, pulumi.Input<string>>;
    logGroupRetentionDays?: pulumi.Input<number>;
    tags?: Record<string, string>;
}

export abstract class AbstractFunction extends pulumi.ComponentResource {
    readonly iamRole: aws.iam.Role;

    readonly lambdaFunction: aws.lambda.Function;

    readonly logGroup: aws.cloudwatch.LogGroup;

    protected name: string;

    protected logGroupRetentionDays: pulumi.Input<number>;

    constructor(
        type: string,
        name: string,
        args: AbstractFunctionArgs,
        opts?: pulumi.ResourceOptions
    ) {
        super(type, name, {}, opts);

        this.name = name;
        this.logGroupRetentionDays = args.logGroupRetentionDays || 14;

        const iamRoleArgs = this.prepareIamRoleArgs(args);
        const iamRole = this.createIamRole(iamRoleArgs);

        const lambdaFunctionArgs = this.prepareLambdaFunctionArgs(iamRole, args);
        const lambdaFunction = this.createLambdaFunction(lambdaFunctionArgs);

        const logGroupArgs = this.prepareLogGroupArgs(lambdaFunction, args);
        const logGroup = this.createLogGroup(logGroupArgs);

        this.iamRole = iamRole;
        this.lambdaFunction = lambdaFunction;
        this.logGroup = logGroup;
    }

    // eslint-disable-next-line class-methods-use-this
    protected prepareIamRoleArgs(args: AbstractFunctionArgs): CreateLambdaRoleArgs {
        return {
            region: args.region,
            accountId: args.accountId,
            inlinePolicies: args.inlinePolicies,
            managedPolicies: args.managedPolicies,
            tags: args.tags,
        };
    }

    protected createIamRole(args: CreateLambdaRoleArgs): aws.iam.Role {
        return createLambdaRole(this.name, args, { parent: this }).role;
    }

    // eslint-disable-next-line class-methods-use-this
    protected prepareLambdaFunctionArgs(
        role: aws.iam.Role,
        args: AbstractFunctionArgs
    ): aws.lambda.FunctionArgs {
        return {
            runtime: aws.lambda.Runtime.NodeJS18dX,
            timeout: 60,
            role: role.arn,
            code: args.code,
            handler: args.handler,
            environment: {
                variables: args.envVars,
            },
            tags: args.tags,
        };
    }

    protected createLambdaFunction(args: aws.lambda.FunctionArgs): aws.lambda.Function {
        return new aws.lambda.Function(this.name, args, { parent: this });
    }

    // eslint-disable-next-line class-methods-use-this
    protected prepareLogGroupArgs(
        lambdaFunction: aws.lambda.Function,
        args: AbstractFunctionArgs
    ): aws.cloudwatch.LogGroupArgs {
        return {
            name: pulumi.interpolate`/aws/lambda/${lambdaFunction.name}`,
            retentionInDays: args.logGroupRetentionDays,
            tags: args.tags,
        };
    }

    protected createLogGroup(args: aws.cloudwatch.LogGroupArgs): aws.cloudwatch.LogGroup {
        return new aws.cloudwatch.LogGroup(`/aws/lambda/${this.name}`, args, { parent: this });
    }
}
