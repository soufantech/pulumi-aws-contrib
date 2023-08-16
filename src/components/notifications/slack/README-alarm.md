How to use
----------

```javascript
import { kms, notifications } from '@soufantech/pulumi-aws-contrib';

// ...

const kmsKeyName = 'notifications';
const kmsKey = new kms.Key(kmsKeyName, {});

const alarmNotification = new notifications.slack.AlarmNotification('alarm-notifications', {
  region,
  accountId,
  kmsKey: kmsKey.kmsKey,
  kmsAlias: kmsKey.kmsAlias,
  encryptedEnvVars: {
    CHAT_WEBHOOK: config.requireSecret('webhook'),
  },
});

// ...

const kmsKeyPolicy = kmsKey.createKeyPolicy(kmsKeyName, accountId, [alarmNotification.iamRole]);

// ...

export const lambdaFunctionArn = alarmNotification.lambdaFunction.arn;
export const snsTopicArn = alarmNotification.snsTopic.arn;
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
  --payload "file://lambda-tests/alarm.json" \
  --cli-binary-format raw-in-base64-out \
  --query "LogResult" --output text \
  result.log | base64 -d
```

*More JSON test files in `./lamda-tests` directory.*

#### SNS tests

Run command bellow (change JSON file):

```shell
aws sns publish \
  --topic-arn "$(pulumi stack output snsTopicArn)" \
  --message "file://sns-tests/alarm.json"
```

*More JSON test files in `./sns-tests` directory.*

Problems
--------

### Why do not use aws.lambda.CallbackFunction

![Failure to serialize native built-in function](docs/aws-lambda-callbackfunction.png)

Reference: https://github.com/pulumi/pulumi/issues/5294