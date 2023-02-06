Project structure
=================

```
alarm/
  commands/
  alarm-builder.ts
  alarm-store-command.ts
  create-alarm-command.ts
  alarm-store.ts
dashboard/
  widgets/
  dashboard-builder.ts
```

Alarms
------

### Abstraction overview

```
alarm > builder > command > store
```

### Builder

The `builder` contains methods to populate an object with the necessary settings to create an `alarm`.

During the building process, some rules are evaluated to ensure that the `alarm` will be created correctly.

### Command

The `commands` abstract the creation of an `alarm` containing the definition of the metrics, limits, evaluation periods, etc.

The commands use `builders` to simplify the `alarms` creation.

**AlarmStoreCommand**

Define a interface that every `command` must implement. The main method is `execute` which create a `alarm` and can receive a `store`.

The `store` is an object that contains the `alarms` created by the `command`. The `store` is passed to the `command` so that it can add the `alarms` created to it.

It's possible to create the `alarm` without adding it to the `store`.

> For now only the creation `command` exists, but in the future there may be others, e.g. delete `command`.

**CreateAlarmCommand**

Define a interface for the creation `commands`, i.e. essentially they should return an `alarm`.

**Commands**

Each alarm `command` is related to some metric of a service.

### Store

The `store` is an object that contains the `alarms` created by the `command`.

The store is responsible for managing the list of created `alarms`, adding or removing according to the `commands` passed.

Dashboards
----------

_Missing documentation_

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

### Create a new alarm

_Missing documentation_

### Create a new widget

_Missing documentation_

### Index file

**Export funcions**
  
```typescript
export { memoryAndCpuExtra } from './create-memory-and-cpu-extra-widgets';
```

**Export classes**

```typescript
export { CpuUtilization } from './create-cpu-utilization-alarm';
```

**Export interfaces**

```typescript
export { CreateParameterStorePolicyArgs } from './parameter-store';
```

**Export grouped resources**

```typescript
import * as policyFactories from './policy-factories';

export {
    policyFactories,
};
```

**Forwards exports to upper level**

```typescript
export * from './utils';
```
