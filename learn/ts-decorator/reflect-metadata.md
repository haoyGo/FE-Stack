## Reflect Metadata

A powerful reflection API should allow us to examine an unknown object at `run-time` and find out everything about it. We should be able to find things like:

* The name of the entity.
* The type of the entity.
* Which interfaces are implemented by the entity.
* The name and types of the properties of the entity.
* The name and types of the constructor arguments of the entity.

In JavaScript we can use functions like `Object.getOwnPropertyDescriptor()` or `Object.keys()` to find some information about an entity but we need reflection to implement more powerful development tools.

**reflect-metadata 包内部定义了三种 keys：**
1. Type metadata uses the metadata key `design:type`.
2. Parameter type metadata uses the metadata key `design:paramtypes`.
3. Return type metadata uses the metadata key `design:returntype`.

