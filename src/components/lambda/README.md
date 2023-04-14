Role
----

This component forces the creation of the role inside the `/lambda` path, thus allowing:

- Better restriction on the privileges of the IAM Role used to deploy the stack
- Better control on resource-based policies, SCP and other types of policies

This component is a factory above the `iam.Role` component and beyond the path, it add:

- Trust relationship to the lambda.amazonaws.com service
- Permissions to write logs to CloudWatch

```typescript
import { lambda } from '@soufantech/pulumi-aws-contrib';

const name = 'main-api';

const { role } = lambda.createLambdaRole(name, {
    name,
    maxSessionDuration: 3600,
});
```
