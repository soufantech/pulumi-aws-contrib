Key
---

It facilitates the creation of keys by creating both the key and the alias in an abstract way.

This component also allows late configuration of access policies, allowing other principals (e.g. user or role) to be created referencing that key and then have their ARNs linked to the key's access policy.

```typescript
import { kms, notifications } from '@soufantech/pulumi-aws-contrib';

const kmsKeyName = 'notifications';
const kmsKey = new kms.Key(kmsKeyName, {});

const alarmNotification = new notifications.slack.AlarmNotification(
    'alarm-notifications',
    {...}
);

const ecsDeployNotification = new notifications.slack.EcsDeployNotification(
    'ecs-deploy-notifications',
    {...}
);

kmsKey.createKeyPolicy(kmsKeyName, accountId, [
    alarmNotification.iamRole,
    ecsDeployNotification.iamRole,
]);
```
