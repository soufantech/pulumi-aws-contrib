Role
----

This component forces the creation of the role inside the `/ecs` path, thus allowing:

- Better restriction on the privileges of the IAM Role used to deploy the stack
- Better control on resource-based policies, SCP and other types of policies

Service
-------

### Lifecycle of the application

The use of this component is intended for the application `setup` time and not for its `deployment` since the task definition state management is not very effective. Therefore, it is not necessary to specify an image, a placeholder image will be used instead.

During the lifetime of the application, some of its settings will change and are therefore ignored during stack deployment through Pulumi's options (i.e. `ignoreChanges`).

- Setup: ECS service is created with a placeholder image
- Deploy: ECS service is updated with the new image through a new task definition
- Runtime: ECS service desired count is changed due to auto scaling

### Capacity

This component has an emphasis on defining capability for both scalability and observability purposes. Therefore, the following fields are mandatory:

- memoryReservation
- memory
- cpu
- minCapacity
- maxCapacity

### Deployment

The `placement strategy` used focuses on distributing the tasks between the Availability Zones and, as a second criterion, the distribution between different available Instances. This strategy is called the `AZ balanced spread`.

The default setting for the minimum and maximum percentage for `rolling update` is `100` and `200` respectively. These values can be changed, but some care must be taken and some scenarios are highlighted below:

- If the `hostPort` is fixed, it should not be possible to add a second task, so the `maximum` should be `100`.
- You should always evaluate whether the `minimum` and `maximum` are possible based on the configured limitations, for example:
  - If `desired count = 1`, reducing 1 task would set the `minimum` percentage to `0` and adding 1 task would set the `maximum` percentage to `200`. That is, for the task to be replaced, the `minimum` percentage cannot be greater than `0` or the `maximum` percentage cannot be less than `200`.
  - If `desired count = 3`, reducing 1 task would set the `minimum` percentage to approximately `66` and adding 1 task would set the maximum percentage to approximately `133`. That is, for the replacement of tasks to take place or the `minimum` percentage cannot be greater than `66` or the maximum percentage cannot be less than `133`. Due to the rounding suggested `60/140` as limits.
- If your environment has a high number of tasks, beware of the default `maximum` percentage value (i.e. `200`), as this can generate twice as many tasks during deployment.

Lastly, the `circuit breaker` is enabled by default, care must be taken not to assume that the task has been deployed while actually being rolled back.

### Auto Scaling

The auto scaling by default is set to `Target Tracking` using the `CPU Utilization` metric. The base calculation considers `30 tasks per instance`, that is, `3.34% CPU as a target`.

From the point of view of `memory` available per task, the following calculation can be performed:

- For an instance of `8GiB` memory divided by `30` tasks results in `~273MiB` per task.
- For an instance of `16GiB` memory divided by `30` tasks results in `~546MiB` per task.

The `scale out cooldown` is `60` and the `scale in cooldown` is `120` by default.

The auto scaling can be `disabled` in favor of an external configuration, e.g. Step Scaling or Scheduled Scaling.

### Log

Some settings regarding logging are highlighted here:

- Log Group uses a path pattern, i.e. `/custom/ecs/{app-name}`
- Log Group uses a log retention default of 180 days
- Log Stream gets container name in task definition to link log to ECS task pane

### Load Balancer

Supports the use of load balancer if the Target Group is specified.

### Other information

Tag propagation is configured to use the Task Definition instead of the ECS service allowing adjustments during deploy time.
