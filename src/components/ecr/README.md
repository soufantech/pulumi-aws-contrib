Repository
----------

This component assumes some security settings by default, for example:

- Encryption
- Image scan on push
- Tag immutability

You can also specify a list of tag prefixes to which a retention policy will apply as well as the number of images to keep.

```typescript
const { ecrRepository } = new ecr.Repository(name, {
    tagPrefixes: ['dev', 'test', 'prod'],
    tagRetention: 3,
});
```
