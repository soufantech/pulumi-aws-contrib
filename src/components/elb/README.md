ForwardRule
-----------

Creating forwarding rules requires VPC, Load Balancer, and Listener information. This component abstracts the search for this information and already assumes some standard behaviors, such as configuring the health check and using the HTTPS listener.

This component also transparently creates a Target Group.

```typescript
import * as pulumi from '@pulumi/pulumi';

import { elb } from '@soufantech/pulumi-aws-contrib';

const config = new pulumi.Config();

const { loadBalancer, targetGroup } = new elb.ForwardRule('main-api', {
    vpcName: config.require('vpcName'),
    loadBalancerName: config.require('loadBalancerName'),
    conditions: [
        {
            hostHeader: {
                values: [config.require('hostName')],
            },
        },
    ],
});
```