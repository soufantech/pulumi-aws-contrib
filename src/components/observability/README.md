How to use
----------

**See "Problem fix" section before proceeding.**

### Dashboard components

Features:

- Default option for simplified configuration
- Choose the widgets order
- Specify extra widgets
- Change the settings of all widgets centrally
- Use factories

#### Default option for simplified configuration

```typescript
import { EcsServiceDashboard } from '@soufantech/pulumi-aws-contrib';

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

#### Choose the widgets order

```typescript
import { EcsServiceDashboard } from '@soufantech/pulumi-aws-contrib';

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

#### Specify extra widgets

```typescript
import { EcsServiceDashboard, miscWidgets } from '@soufantech/pulumi-aws-contrib';

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
    extraWidgets: {
        begin: miscWidgets.createAlarmWidgets({ mainAlarms: alarmArns }),
    },
});
```

#### Change the settings of all widgets centrally

```typescript
import { EcsServiceDashboard } from '@soufantech/pulumi-aws-contrib';

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
    extraConfigs: {
      shortPeriod: 60,
      longPeriod: 300,
    },
});
```

#### Use factories

```typescript
import * as awsx from '@pulumi/awsx/classic';
import * as pulumi from '@pulumi/pulumi';

import { ecsServiceWidgets, miscWidgets, tgWidgets } from '@soufantech/pulumi-aws-contrib';

// ...

const dashboardComponent = new pulumi.ComponentResource(
    'contrib:components:DashboardAggregator',
    resourceName
);

const dashboard = new awsx.cloudwatch.Dashboard(
    resourceName,
    {
        widgets: [
            ...miscWidgets.createAlarmWidgets({ mainAlarms: alarmArns }),
            ...ecsServiceWidgets.createTaskCountWidgets({ clusterName, serviceName, asgName }),
            ...tgWidgets.createUptimeAndHealthyWidgets({ loadBalancer, targetGroup }),
            ...tgWidgets.createLatencyAndRequestCountWidgets({ loadBalancer, targetGroup }),
            ...ecsServiceWidgets.createMemoryAndCpuWidgets({ clusterName, serviceName }),
            ...ecsServiceWidgets.createMemoryAndCpuExtraWidgets({ clusterName, serviceName }),
            ...ecsServiceWidgets.createNetworkAndStorageWidgets({ clusterName, serviceName }),
        ],
    },
    { parent: dashboardComponent }
);
```

### Alarm components

Features:

- Choose which alarms to activate
- Change the settings of all alarms centrally
- Use factories

#### Choose which alarms to activate

```typescript
import { EcsServiceAlarm } from '@soufantech/pulumi-aws-contrib';

// ...

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
        memoryUtilization: 40,
        cpuUtilization: 5,
        networkTxBytes: 20 * 1024 * 1024 * 1024,
        networkRxBytes: 25 * 1024 * 1024 * 1024,
        storageWriteBytes: 2 * 1024 * 1024,
        storageReadBytes: 400 * 1024 * 1024,
    },
});
const alarmsArns = Object.values(alarms.alarms || []).map((alarm) => alarm.arn);
```

#### Change the settings of all alarms centrally

```typescript
import { EcsServiceAlarm } from '@soufantech/pulumi-aws-contrib';

// ...

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
    },
    extraConfigs: {
        snsTopicArns,
        datapointsToAlarm: 5,
        evaluationPeriods: 5,
        period: 300,
    },
});
const alarmsArns = Object.values(alarms.alarms || []).map((alarm) => alarm.arn);
```

#### Use factories

```typescript
import * as pulumi from '@pulumi/pulumi';

import { ecsServiceAlarm, tgAlarm } from '@soufantech/pulumi-aws-contrib';

// ...

const alarmComponent = new pulumi.ComponentResource(
    'contrib:components:EcsServiceAlarm',
    resourceName
);

const alarms = [
    tgAlarm.createUptimeAlarm(
        resourceName,
        95,
        { loadBalancer, targetGroup },
        { parent: alarmComponent, snsTopicArns }
    ),
    ecsServiceAlarm.createCpuUtilizationAlarm(
        resourceName,
        5,
        { clusterName, serviceName },
        { parent: alarmComponent, snsTopicArns }
    ),
];
const alarmArns = alarms.map((alarm) => alarm.arn);
```

Problem fix
-----------

### Quick solution (@pulumi/awsx@0.40.0)

```shell
# in project root directory run...
cp ./problem-fix/*.{js,ts} ./node_modules/@pulumi/awsx/classic/cloudwatch
```

To ensure that the files work the version of the `@pulumi/awsx` package needs to be fixed.  That is, whenever updating this package, it is necessary to redo the manual process.

### Manual solution

It is necessary to insert the ID property in several parts of the code. And to identify the exact position, let's reference the already existing `yAxis` property.

Below is the list of files with the context where the line should be inserted and the `yAxis` property above each insertion point of the `id` property.

#### node_modules/@pulumi/awsx/classic/cloudwatch/metric.js

```javascript
...
class Metric {
    ...
    constructor(args, resource) {
        ...
        this.yAxis = utils.ifUndefined(args.yAxis, "left");
        this.id = pulumi.output(args.id);
    }
    with(change) {
        ...
        result = hasOwnProperty(change, "yAxis") ? result.withYAxis(change.yAxis) : result;
        result = hasOwnProperty(change, "id") ? result.withId(change.id) : result;
        return result;
    }
    ...
    spread() {
        return {
            ...
            yAxis: this.yAxis,
            id: this.id,
        };
    }
    ...
    withYAxis(yAxis) {
        return new Metric(Object.assign(Object.assign({}, this.spread()), { yAxis }), this.resource);
    }
    withId(id) {
        return new Metric(Object.assign(Object.assign({}, this.spread()), { id }), this.resource);
    }
    ...
    addWidgetJson(metrics) {
        ...
        const op = pulumi.all(...
            ...
            const renderingProps = {
                ...
                yAxis: uw.yAxis,
                id: uw.id,
            };
            ...
    }
}
...
```

#### node_modules/@pulumi/awsx/classic/cloudwatch/metric.d.ts

```typescript
...
export declare class Metric {
    ...
    /**
     * Where on the graph to display the y-axis for this metric. The default is left.
     *
     * Only used if this metric is displayed in a [Dashboard] with a [MetricWidget].
     */
    readonly yAxis: pulumi.Output<"left" | "right">;
    /**
     * The id of this metric. This id can be used as part of a math expression.
     */
    readonly id: pulumi.Output<string | undefined>;
    ...
    withYAxis(yAxis: pulumi.Input<"left" | "right"> | undefined): Metric;
    withId(id: pulumi.Input<string> | undefined): Metric;
    ...
}
...
export interface MetricChange {
    ...
  /**
   * Where on the graph to display the y-axis for this metric. The default is left.
   *
   * Only used if this metric is displayed in a [Dashboard] with a [MetricWidget].
   */
  yAxis?: pulumi.Input<"left" | "right">;
  /**
   * The id of this metric. This id can be used as part of a math expression.
   */
  id?: pulumi.Input<string>;
}
...
export interface MetricArgs {
    ...
    /**
     * Where on the graph to display the y-axis for this metric. The default is left.
     *
     * Only used if this metric is displayed in a [Dashboard] with a [MetricWidget].
     */
    yAxis?: pulumi.Input<"left" | "right" | undefined>;
    /**
     * The id of this metric. This id can be used as part of a math expression.
     */
    id?: pulumi.Input<string | undefined>; 
}
...
```

#### node_modules/@pulumi/awsx/classic/cloudwatch/widgets_json.d.ts

```typescript
...
export interface MetricWidgetPropertiesJson {
    ...
    yAxis: pulumi.Input<YAxis> | undefined;
    id: pulumi.Input<string> | undefined;
}
...
export interface RenderingPropertiesJson {
    ...
    yAxis: "right" | "left" | undefined;
    id: string | undefined;
}
...
```

How to contribute
-----------------

### In alarm components

#### Create new alarm factory (for use in ComponentResource)

The alarms are separated by categories according to the parameters received in the `configs` attribute. See below the interface of an alarm factory.

```typescript
type AlarmFactory = (
    name: string,
    threshold: number,
    configs: Record<string, string>,
    extraConfigs?: AlarmExtraConfigs
) => aws.cloudwatch.MetricAlarm;
```

- Identify the alarm category
- Create a factory with the signature of `AlarmFactory`
- Use `export default function createAlarm();`
- `configs` can be a more specific type
  - e.g. `AlbConfig`, `TargetGroupConfig`, `EcsClusterConfig`, etc
- Create and populate default values for `extraConfigs` attributes
- Create and populate `options` object
- Create `MetricAlarm` with `aws` module
  - or create `Metric` and then use `createAlarm` with `awsx` module
- Add to category index

#### Create new alarm factory category

- Create directory for new alarm category (categories are based on required `configs`)
  - e.g. `ecs-service` requires `clusterName` and `serviceName` in `configs`
- Create index file inside directory
- Add as module in index file hierarchically above

#### Add alarm factory in abstracted component

Factories are encapsulated by private methods responsible for translating the most simplified configurations to specific configurations. See below the interface of a private method.

```typescript
type WrapperAlarmFactory = (
    name: string,
    threshold: number,
    configs: Record<string, string>,
    extraConfigs?: WrapperAlarmExtraConfigs
) => aws.cloudwatch.MetricAlarm | undefined;
```

- Create private method calling factory
  - Use guard clause to check the configs
  - Create config object according to used factory
  - Call factory passing the arguments
- Add new option in type `...AlarmOptionKey`
- Add new method to `actionDict`

#### Create new configs in abstracted component

Steps:

- Add config in `...AlarmConfigKey`

### In dashboard components

#### Create new widget factory (for use in ComponentResource)

The widgets are separated by categories according to the parameters received in the `configs` attribute. See below the interface of a widget factory.

```typescript
type WidgetFactory = (
    configs: Record<string, string>,
    extraConfigs?: WidgetExtraConfigs
) => Widget[];
```

- Identify the widget category
- Create a factory with the signature of `WidgetFactory`
- Use `export default function createWidgets();`
- `configs` can be a more specific type
  - e.g. `AlbConfig`, `TargetGroupConfig`, `EcsClusterConfig`, etc
- Create and populate default values for `extraConfigs` attributes
- Create `Metric` or `ExpressionWidgetMetric` and then use in widgets components (with `awsx`)
- Add to category index

#### Create new widget factory category

- Create directory for new widget category (categories are based on required `configs`)
  - e.g. `ecs-service` requires `clusterName` and `serviceName` in `configs`
- Create index file inside directory
- Add as module in index file hierarchically above

#### Add widget factory in abstracted component

Factories are encapsulated by private methods responsible for translating the most simplified configurations to specific configurations. See below the interface of a private method.

```typescript
type WrapperWidgetFactory = (
    configs: Record<string, string>,
    extraConfigs?: WrapperWidgetExtraConfigs
) => Widget[];
```

- Create private method calling factory
  - Use guard clause to check the configs
  - Create config object according to used factory
  - Call factory passing the arguments
- Add new option in type `...DashboardOptionKey`
- Add new method to `actionDict`

#### Create new configs in abstracted component

Steps:

- Add config in `...DashboardConfigKey`
- *For EcsAggregationDashboard component use `...DashboardConfig`
