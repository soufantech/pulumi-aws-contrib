import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface LogGroupArgs {
    scope: pulumi.Input<string>;
    prefix?: pulumi.Input<string>;
    retentionInDays?: pulumi.Input<number>;
}

export class LogGroup {
    readonly logGroup: aws.cloudwatch.LogGroup;

    constructor(name: string, args: LogGroupArgs, opts?: pulumi.CustomResourceOptions) {
        const prefix = args.prefix ?? 'custom';
        const retentionInDays = args.retentionInDays ?? 180;

        const logName = `/${prefix}/${args.scope}/${name}`;

        this.logGroup = new aws.cloudwatch.LogGroup(name, { name: logName, retentionInDays }, opts);
    }
}
