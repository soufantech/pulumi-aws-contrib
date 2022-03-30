### Why not use aws.lambda.CallbackFunction

![Failure to serialize native built-in function](./docs/aws-lambda-callbackfunction.png)

Reference: https://github.com/pulumi/pulumi/issues/5294

### How change lambda function

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