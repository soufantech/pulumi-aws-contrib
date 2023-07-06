import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface LogGroupArgs {
    scope: pulumi.Input<string>;
    prefix?: pulumi.Input<string>;
    name?: pulumi.Input<string>;
    retentionInDays?: pulumi.Input<number>;
    tags?: Record<string, pulumi.Input<string>>;
}

export class LogGroup {
    readonly logGroup: aws.cloudwatch.LogGroup;

    constructor(name: string, args: LogGroupArgs, opts?: pulumi.CustomResourceOptions) {
        const prefix = args.prefix ?? 'custom';
        const resourceName = args.name ?? name;
        const retentionInDays = args.retentionInDays ?? 180;

        const logName = pulumi.interpolate`/${prefix}/${args.scope}/${resourceName}`;

        this.logGroup = new aws.cloudwatch.LogGroup(
            name,
            {
                name: logName,
                retentionInDays,
                tags: args.tags,
            },
            opts
        );
    }
}
