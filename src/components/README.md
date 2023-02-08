
How to contribute
-----------------

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
