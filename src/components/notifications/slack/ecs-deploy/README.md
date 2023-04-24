How to use
----------

```javascript
import { kms, notifications } from '@soufantech/pulumi-aws-contrib';

// ...

const kmsKeyName = 'notifications';
const kmsKey = new kms.Key(kmsKeyName, {});

const ecsDeployNotification = new notifications.slack.EcsDeployNotification('ecs-deploy-notifications', {
  region,
  accountId,
  kmsKey: kmsKey.kmsKey,
  kmsAlias: kmsKey.kmsAlias,
  encryptedEnvVars: {
    CHAT_WEBHOOK: config.requireSecret('webhook'),
  },
});

// ...

const kmsKeyPolicy = kmsKey.createKeyPolicy(kmsKeyName, accountId, [ecsDeployNotification.iamRole]);

// ...

const ecsDeployEventRule = new aws.cloudwatch.EventRule('ecs-deploy', {
    description: 'ECS Deployment State Change',
    eventPattern: JSON.stringify({
        source: ['aws.ecs'],
        'detail-type': ['ECS Deployment State Change'],
    }),
});
ecsDeployEventRule.onEvent('ecs-deploy', ecsDeployNotification.lambdaFunction);

// ...

export const lambdaFunctionArn = ecsDeployNotification.lambdaFunction.arn;
```

How to contribute
-----------------

### How to test

How to test projects using this component.

#### Lambda tests

Run command bellow (change JSON file):

```shell
aws lambda invoke \
  --function-name "$(pulumi stack output lambdaFunctionArn)" \
  --log-type "Tail" \
  --payload "file://lambda-tests/failed.json" \
  --cli-binary-format raw-in-base64-out \
  --query "LogResult" --output text \
  result.log | base64 -d
```

*More JSON test files in `./lamda-tests` directory.*

Problems
--------

### Why do not use aws.lambda.CallbackFunction

![Failure to serialize native built-in function](docs/aws-lambda-callbackfunction.png)

Reference: https://github.com/pulumi/pulumi/issues/5294
