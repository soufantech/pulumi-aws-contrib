import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface ForwardRuleArgs {
    vpcName: pulumi.Input<string>;
    loadBalancerName: pulumi.Input<string>;
    conditions: pulumi.Input<pulumi.Input<aws.types.input.lb.ListenerRuleCondition>[]>;
    targetPort?: pulumi.Input<number>;
    targetProtocol?: pulumi.Input<string>;
    healthCheck?: pulumi.Input<aws.types.input.lb.TargetGroupHealthCheck>
    listenerPort?: pulumi.Input<number>;
    name?: pulumi.Input<string>;
    tags?: Record<string, pulumi.Input<string>>;
}

export class ForwardRule {
    readonly targetGroup: aws.lb.TargetGroup;

    readonly rule: aws.lb.ListenerRule;

    readonly vpc: pulumi.Output<aws.ec2.GetVpcResult>;

    readonly loadBalancer: pulumi.Output<aws.lb.GetLoadBalancerResult>;

    readonly listener: pulumi.Output<aws.lb.GetListenerResult>;

    constructor(name: string, args: ForwardRuleArgs) {
        this.vpc = aws.ec2.getVpcOutput({
            tags: { Name: args.vpcName },
        });

        this.targetGroup = new aws.lb.TargetGroup(name, {
            name: args.name,
            targetType: 'instance',
            vpcId: this.vpc.id,
            port: args.targetPort ?? 3000,
            protocol: args.targetProtocol ?? 'HTTP',
            healthCheck: args.healthCheck ?? { path: '/health' },
            tags: args.tags,
        });

        this.loadBalancer = aws.lb.getLoadBalancerOutput({
            name: args.loadBalancerName,
        });

        this.listener = aws.lb.getListenerOutput({
            loadBalancerArn: this.loadBalancer.arn,
            port: args.listenerPort ?? 443,
        });

        this.rule = new aws.lb.ListenerRule(name, {
            listenerArn: this.listener.arn,
            conditions: args.conditions,
            actions: [
                {
                    type: 'forward',
                    targetGroupArn: this.targetGroup.arn,
                },
            ],
            tags: args.tags,
        });
    }
}
