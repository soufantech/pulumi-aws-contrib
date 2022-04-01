How to use
----------

### Dashboards

Features:

- Default option for simplified configuration
- Possibility to choose the order of widgets
- Possibility to specify extra widgets

#### Default option for simplified configuration

```javascript
import { EcsServiceDashboard } from '@soufantech/pulumi-contrib';

// ...

new EcsServiceDashboard(resourceName, {
    configs: {
        clusterName,
        serviceName,
        loadBalancer,
        targetGroup,
        asgName,
    },
    defaultOptions: true,
});
```

#### Possibility to choose the order of widgets

```javascript
import { EcsServiceDashboard } from '@soufantech/pulumi-contrib';

// ...

new EcsServiceDashboard(resourceName, {
    configs: {
        clusterName,
        serviceName,
        loadBalancer,
        targetGroup,
        asgName,
    },
    options: [
        'task',
        'health',
        'request',
        'hardware',
        'hardwareExtra',
        'inputOutput',
    ],
});
```

#### Possibility to specify extra widgets

```javascript
import { EcsServiceDashboard } from '@soufantech/pulumi-contrib';

// ...

new EcsServiceDashboard(resourceName, {
    configs: {
        clusterName,
        serviceName,
        loadBalancer,
        targetGroup,
        asgName,
    },
    extraWidgets: {
        begin: [
            ...createAlarmWidgets({ mainAlarms: alarmsArns }),
            ...EcsServiceDashboard.createTaskCountWidgets(clusterName, serviceName, asgName),
            ...EcsServiceDashboard.createUptimeAndHealthyStatusWidgets(loadBalancer, targetGroup),
            ...EcsServiceDashboard.createLatencyAndRequestCountWidgets(loadBalancer, targetGroup),
            ...EcsServiceDashboard.createMemoryAndCpuUtizilationWidgets(clusterName, serviceName),
            ...EcsServiceDashboard.createMemoryAndCpuExtraInfoWidgets(clusterName, serviceName),
            ...EcsServiceDashboard.createNetworkAndStorageWidgets(clusterName, serviceName),
        ],
    },
});
```

### Alarms

Features:

- Possibility to choose which alarms to activate
- Possibility to specify on which SNS topics to trigger the alarm

```javascript
    const alarms = new EcsServiceAlarm(resourceName, {
        configs: {
            clusterName,
            serviceName,
            loadBalancer,
            targetGroup,
        },
        options: {
            uptime: 95,
            targetResponseTime: 0.5,
            requestCount: 100000,
            requestSpikeCount: 200000,
            memoryUtilization: 40,
            cpuUtilization: 5,
            networkTxBytes: 20 * 1024 * 1024 * 1024,
            networkRxBytes: 25 * 1024 * 1024 * 1024,
            storageWriteBytes: 2 * 1024 * 1024,
            storageReadBytes: 400 * 1024 * 1024,
        },
        snsTopicArns,
    });
    const alarmsArns = Object.values(alarms.alarms || []).map((alarm) => alarm.arn);
```

How to contribute
-----------------

### In alarm components

#### Create new alarms

Steps:

- Implement private static method **(only used internally)**
  - This method takes `name`, `threshold`, `configs`, `snsTopicArns`
  - `configs` is an object with all configurations
  - All configs are passed as optional, so the method must use a guard clause
  - Configs are optional to simplify class parameterization
- Add method to `actionDict`
- Add option to `AlarmOptionKey`
  - All options must receive a number as threshold

#### Create new configs

Steps:

- Add config in `AlarmConfigKey`

### In dashboard components

#### Create new dashboards

Steps:
- 
- Implement private static method **(possible to be used outside the class)**
  - This method receives exactly the configs that will be used (due to its use outside the class)
  - All settings are passed as optional, so the method must use a guard clause
  - Configs are optional to simplify class parameterization
- Add method to `actionDict`
  - Also specify which configs the method should receive
- Add option to `DashboardOptionKey`

#### Create new configs

Steps (for most components):

- Add config in `DashboardConfigKey`

Steps (for EcsAggregationDashboard):

- Add config in `DashboardConfig`