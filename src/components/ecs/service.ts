import * as aws from '@pulumi/aws';
import * as awsn from '@pulumi/aws-native';
import * as pulumi from '@pulumi/pulumi';

import * as cloudwatch from '../cloudwatch';

export interface ServiceArgs {
    awsRegion: pulumi.Input<string>;
    clusterName: pulumi.Input<string>;
    taskRoleArn: pulumi.Input<string>;
    memoryReservation: pulumi.Input<number>;
    memory: pulumi.Input<number>;
    cpu: pulumi.Input<number>;
    minCapacity: pulumi.Input<number>;
    maxCapacity: pulumi.Input<number>;
    containerPort?: pulumi.Input<number>;
    hostPort?: pulumi.Input<number>;
    environment?: Record<string, pulumi.Input<string>>;
    deployMinPercent?: pulumi.Input<number>;
    deployMaxPercent?: pulumi.Input<number>;
    logRetention?: pulumi.Input<number>;
    scaleEnabled?: pulumi.Input<boolean>;
    scaleTarget?: pulumi.Input<number>;
    scaleOutCooldown?: pulumi.Input<number>;
    scaleInCooldown?: pulumi.Input<number>;
    targetGroupArn?: pulumi.Input<string>;
    tags?: Record<string, pulumi.Input<string>>;
}

export class Service extends pulumi.ComponentResource {
    readonly logGroup: aws.cloudwatch.LogGroup;

    readonly ecsTaskDefinition: awsn.ecs.TaskDefinition;

    readonly ecsService: aws.ecs.Service;

    readonly scalingTarget: aws.appautoscaling.Target;

    readonly scalingPolicy?: aws.appautoscaling.Policy;

    constructor(name: string, args: ServiceArgs, opts?: pulumi.CustomResourceOptions) {
        super('contrib:components:Service', name, {}, opts);

        this.logGroup = new cloudwatch.LogGroup(
            name,
            { scope: 'ecs', retentionInDays: args.logRetention, tags: args.tags },
            { parent: this, deleteBeforeReplace: true }
        ).logGroup;

        this.ecsTaskDefinition = this.createTaskDefinition(name, this.logGroup, args);

        const ecsCluster = aws.ecs.getClusterOutput({ clusterName: args.clusterName });

        this.ecsService = this.createService(name, ecsCluster, this.ecsTaskDefinition, args);

        this.scalingTarget = this.createScalingTarget(name, ecsCluster, args);

        this.scalingPolicy = this.createScalingPolicy(
            name,
            this.scalingTarget,
            this.ecsService,
            args
        );
    }

    private createTaskDefinition(
        name: string,
        logGroup: aws.cloudwatch.LogGroup,
        args: ServiceArgs
    ): awsn.ecs.TaskDefinition {
        const containerName = 'main';
        const containerPort = args.containerPort ?? 3000;
        const hostPort = args.hostPort ?? 0;
        const environment = args.environment ?? {};

        const defaultTags = aws.getDefaultTagsOutput().tags.apply((tags) =>
            Object.keys(tags).reduce(
                (acc, key) => {
                    acc.push({ key, value: tags[key] });
                    return acc;
                },
                [] as { key: string; value: string }[]
            )
        );

        return new awsn.ecs.TaskDefinition(
            name,
            {
                family: name,
                taskRoleArn: args.taskRoleArn,
                containerDefinitions: [
                    {
                        name: containerName,
                        image: 'hashicorp/http-echo',
                        command: [
                            pulumi.interpolate`-listen=:${containerPort}`,
                            '-text=Hello world',
                        ],
                        memoryReservation: args.memoryReservation,
                        memory: args.memory,
                        cpu: args.cpu,
                        portMappings: [
                            {
                                containerPort,
                                hostPort,
                                protocol: 'tcp',
                            },
                        ],
                        environment: Object.keys(environment).map((key) => ({
                            name: key,
                            value: environment[key],
                        })),
                        logConfiguration: {
                            logDriver: 'awslogs',
                            options: {
                                'awslogs-group': logGroup.name,
                                'awslogs-region': args.awsRegion,
                                'awslogs-stream-prefix': containerName,
                            },
                        },
                    },
                ],
                tags: {
                    ...defaultTags,
                    ...args.tags,
                },
            },
            {
                dependsOn: logGroup,
                replaceOnChanges: [''],
                parent: this,
            }
        );
    }

    private createService(
        name: string,
        ecsCluster: pulumi.Output<aws.ecs.GetClusterResult>,
        ecsTaskDefinition: awsn.ecs.TaskDefinition,
        args: ServiceArgs
    ): aws.ecs.Service {
        const containerName = 'main';
        const containerPort = args.containerPort ?? 3000;

        return new aws.ecs.Service(
            name,
            {
                name,
                cluster: ecsCluster.arn,
                taskDefinition: ecsTaskDefinition.taskDefinitionArn,
                desiredCount: 1,
                deploymentMinimumHealthyPercent: args.deployMinPercent ?? 100,
                deploymentMaximumPercent: args.deployMaxPercent ?? 200,
                propagateTags: 'TASK_DEFINITION',
                orderedPlacementStrategies: [
                    { type: 'spread', field: 'attribute:ecs.availability-zone' },
                    { type: 'spread', field: 'instanceId' },
                ],
                deploymentCircuitBreaker: {
                    enable: true,
                    rollback: true,
                },
                loadBalancers: args.targetGroupArn
                    ? [{ containerName, containerPort, targetGroupArn: args.targetGroupArn }]
                    : [],
                tags: args.tags,
            },
            {
                parent: this,
                ignoreChanges: ['desiredCount', 'taskDefinition'],
            }
        );
    }

    private createScalingTarget(
        name: string,
        ecsCluster: pulumi.Output<aws.ecs.GetClusterResult>,
        args: ServiceArgs
    ): aws.appautoscaling.Target {
        return new aws.appautoscaling.Target(
            name,
            {
                minCapacity: args.minCapacity,
                maxCapacity: args.maxCapacity,
                resourceId: pulumi.interpolate`service/${ecsCluster.clusterName}/${name}`,
                scalableDimension: 'ecs:service:DesiredCount',
                serviceNamespace: 'ecs',
            },
            { parent: this }
        );
    }

    private createScalingPolicy(
        name: string,
        scalingTarget: aws.appautoscaling.Target,
        ecsService: aws.ecs.Service,
        args: ServiceArgs
    ): aws.appautoscaling.Policy | undefined {
        const scaleEnabled = args.scaleEnabled ?? true;

        if (scaleEnabled) {
            return new aws.appautoscaling.Policy(
                name,
                {
                    policyType: 'TargetTrackingScaling',
                    resourceId: scalingTarget.resourceId,
                    scalableDimension: scalingTarget.scalableDimension,
                    serviceNamespace: scalingTarget.serviceNamespace,
                    targetTrackingScalingPolicyConfiguration: {
                        // CPU calc: 100% CPU / 30 tasks = 3.34% CPU per task
                        // Memory example: instance with 8GiB memory / 30 tasks = ~273MiB per task
                        // Memory example: instance with 16GiB memory / 30 tasks = ~546MiB per task
                        targetValue: args.scaleTarget ?? 3.34,
                        scaleOutCooldown: args.scaleOutCooldown ?? 60,
                        scaleInCooldown: args.scaleInCooldown ?? 120,
                        predefinedMetricSpecification: {
                            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
                        },
                    },
                },
                { parent: this, dependsOn: ecsService }
            );
        }

        return undefined;
    }
}
