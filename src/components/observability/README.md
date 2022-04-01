How to use
----------

**See "Problem fix" section before proceeding.**

### Dashboards

Features:

- Default option for simplified configuration
- Possibility to choose the order of widgets
- Possibility to specify extra widgets

#### Default option for simplified configuration

```javascript
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

#### Possibility to choose the order of widgets

```javascript
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

#### Possibility to specify extra widgets

```javascript
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

Problem fix
-----------

### Quick solution (@pulumi/awsx@0.40.0)

```shell
# in project root directory run...
cp ./problem-fix/*.{js,ts} ./node_modules/@pulumi/awsx/cloudwatch
```

To ensure that the files work the version of the `@pulumi/awsx` package needs to be fixed.  That is, whenever updating this package, it is necessary to redo the manual process.

### Manual solution

It is necessary to insert the ID property in several parts of the code. And to identify the exact position, let's reference the already existing `yAxis` property.

Below is the list of files with the context where the line should be inserted and the `yAxis` property above each insertion point of the `id` property.

#### node_modules/@pulumi/awsx/cloudwatch/metric.js

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

#### node_modules/@pulumi/awsx/cloudwatch/metric.d.ts

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

#### node_modules/@pulumi/awsx/cloudwatch/widgets_json.d.ts

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