How to use
----------

```javascript
import { kms, notifications } from '@soufantech/pulumi-aws-contrib';

// ...

const kmsKeyName = 'notifications';
const kmsKey = new kms.Key(kmsKeyName, {});

const alarmNotification = new notifications.SlackAlarmNotification('alarm-notifications', {
  region,
  accountId,
  chatWebhook: config.requireSecret('webhook'),
  kmsKey: kmsKey.kmsKey,
  kmsAlias: kmsKey.kmsAlias,
});

// ...

const kmsKeyPolicy = kmsKey.createKeyPolicy(kmsKeyName, accountId, [alarmNotification.role.arn]);

export const lambdaFunctionArn = alarmNotifications.lambdaFunction.arn;
export const snsTopicArn = alarmNotifications.snsTopic.arn;
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
