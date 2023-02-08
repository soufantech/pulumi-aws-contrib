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
  builders/
  widgets/
```

Alarm
-----

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

### Component list

- AsgAlarmCommands
  - AsgMaxSize
- EcsClusterAlarmCommands
  - CpuUtilization
  - MemoryUtilization
  - NetworkBytes
  - StorageBytes
- EcsServiceAlarmCommands
  - CpuUtilization
  - MemoryUtilization
  - NetworkBytes
  - StorageBytes
- RdsAlarmCommands
  - BurstBalance
  - CpuUtilization
  - DatabaseConnections
  - FreeStorageSpace
  - FreeableMemory
- TgAlarmCommands
  - RequestCount
  - TargetResponseTime
  - Uptime

Dashboard
---------

### Abstraction overview

```
dashboard > widget > metric|alarm|log|text
```

### Widget Builders

```
(widget) ---> MetricWidgetBuilder ---> (metrics) ---> MetricBuilder ---> (metric)
          |                        |              |-> ExpressionBuilder ---> (expression)
          |                        |
          |                        |-> (annotations) ----> AlarmAnnotationBuilder
          |                                            |-> HorizontalAnnotationBuilder
          |                                            |-> VerticalAnnotationBuilder
          |-> AlarmWidgetBuilder ---> (alarm ARNs)
          |-> LogWidgetBuilder ---> (log insights)
          |-> TextWidgetBuilder ---> (markdown text)
```

In this represention the `widget` represents the expected result, that is, the object that will be passed to the `dashboard` creation.

The first level of `builders` are responsible for creating different `widget` types.

The other `builders` are utilities to help configure the metric `builder`.

### Widget Sets

To facilitate the construction of the `dashboard`, some sets of `widgets` are available where each set represents a row of the `dashboard`.

### Dashboard Builder

The dashboard `builder` receives a ordered list of `widgets` and creates a `dashboard` with them.

### Component list

- asgWidgets (Auto Scaling Group)
  - networkAndStorageIoBytes
  - networkAndStorageIoCount
- ecsAggregationWidgets (ECS Aggregation)
  - instanceMemoryAndCpu
  - latencyAndRequestCount
  - serviceMemoryAndCpu
  - taskCount
  - uptimeAndHealthy
- ecsClusterWidgets (ECS Cluster)
  - memoryAndCpu
  - networkAndStorageRate
  - taskCount
- ecsServiceWidgets (ECS Service)
  - memoryAndCpu
  - networkAndStorage
  - taskCount
- misc
  - alarm
  - sqs
- tgWidgets (Target Group)
  - latencyAndRequestCount
  - uptimeAndHealthy

How to contribute
-----------------

### Create a new alarm

_Missing documentation_

### Create a new widget

_Missing documentation_
