Role
----

It takes basic settings as default and provides a simplified interface, e.g. `assumeRoleStatements` instead of `assumeRolePolicy` (facilitates the increment of the Trust Relationship policy).

Utils
-----

### createManagedPolicyArn

Pulumi provides the ARN for many AWS Managed Policies, but it is only a subset of the total.

```typescript
import * as aws from '@pulumi/aws';

const s3RoArn = aws.iam.ManagedPolicy.AmazonS3ReadOnlyAccess;
```

This function provides an abstraction to build the remaining ARNs in a less verbose way.

```typescript
import { iam } from '@soufantech/pulumi-aws-contrib';

const caRo = iam.createManagedPolicyArn('AWSCodeArtifactReadOnlyAccess');
```

### createAssumeRolePolicyForUser

Pulumi provides a simplified way to create a Trust Relationship policy for a specific Principal.

```typescript
import * as aws from '@pulumi/aws';

const role = new aws.iam.Role('ecs-app', {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: 'ecs-tasks.amazonaws.com',
    }),
});
```

Similarly this method provides a simplified way to enable an IAM User to assume the role being created.

```typescript
import { iam } from '@soufantech/pulumi-aws-contrib';

const accountId = pulumi.output(
    aws.getCallerIdentity().then((callerIdentity) => callerIdentity.accountId)
);

const ghaUser = 'gh-actions';

const { role } = new iam.Role(name, {
    assumeRoleStatements: iam.createAssumeRolePolicyForUser(ghaUser, accountId),
});
```

Policy Factories
----------------

The use of Custom Managed Policies simplifies the access management process, however this approach leads to the need for generalization. This generalization can increase privileges and not meet the principle of least privilege.

To reconcile the reuse of complex permissions with the ability to define specific resources, we created Policy Factories.

```typescript
import { iam } from '@soufantech/pulumi-aws-contrib';

const envShortName = pulumi.getStack();

const parameterStorePolicy = iam.policyFactories.createParameterStorePolicy(
    awsRegion,
    accountId,
    {
        parameterPaths: [
            pulumi.interpolate`${envShortName}/specific-api/*`,
            pulumi.interpolate`${envShortName}/global/temp1/*`,
            pulumi.interpolate`${envShortName}/global/temp2/*`,
        ],
        kmsKey: pulumi.interpolate`alias/${envShortName}`,
    }
);
```

### Component list

- createParameterStorePolicy
