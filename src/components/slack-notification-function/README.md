## Why not use aws.lambda.CallbackFunction

![Failure to serialize native built-in function](./docs/aws-lambda-callbackfunction.png)

Reference: https://github.com/pulumi/pulumi/issues/5294

## How change lambda function

```shell
cd function
yarn install
# edit file in src/ directory
yarn build
git add .  # include dist/ directory
git commit -m "message here"
```

- Motivation: lambda function runtimes don't have the latest version of aws-sdk
- This flow uses webpack and makes it possible to add future external packages
- Reference: https://maxsmolens.org/posts/bundling-an-aws-lambda-function-using-webpack/
- Alternative using lambda layer: https://aws.amazon.com/pt/premiumsupport/knowledge-center/lambda-layer-aws-sdk-latest-version/

## Tests

How to test projects using this component.

### Lambda tests

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

### SNS tests

Run command bellow (change JSON file):

```shell
aws sns publish \
  --topic-arn "$(pulumi stack output snsTopicArn)" \
  --message "file://sns-tests/alarm.json"
```

*More JSON test files in `./sns-tests` directory.*
