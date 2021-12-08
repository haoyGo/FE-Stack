## [Pick](https://github.com/type-challenges/type-challenges/blob/master/questions/4-easy-pick/README.zh-CN.md)
``` ts
type MyPick<T, K extends keyof T> = {
  [key in K]: T[key]
}
```

## [Omit](https://github.com/type-challenges/type-challenges/blob/master/questions/3-medium-omit/README.zh-CN.md)
``` ts
type MyOmit<T, K extends keyof T> = {
  [key in Exclude<keyof T, K>]: T[key]
}
```

## [Exclude](https://github.com/type-challenges/type-challenges/blob/master/questions/43-easy-exclude/README.zh-CN.md)
``` ts
type MyExclude<T, U> = T extends U ? never : T
```

## [Readonly](https://github.com/type-challenges/type-challenges/blob/master/questions/7-easy-readonly/README.zh-CN.md)
``` ts
type MyReadonly<T> = {
  readonly [key in keyof T]: T[key]
}
```

## [Concat](https://github.com/type-challenges/type-challenges/blob/master/questions/533-easy-concat/README.zh-CN.md)
``` ts
type Concat<T extends any[], U extends any[]> = [...T, ...U]
```

## [FirstOfArray](https://github.com/type-challenges/type-challenges/blob/master/questions/14-easy-first/README.zh-CN.md)
``` ts
type FirstOfArray<T extends any[]> = T extends [first: infer F, ...rest: any[]] ? F : never
```

## [元祖转对象](https://github.com/type-challenges/type-challenges/blob/master/questions/11-easy-tuple-to-object/README.zh-CN.md)
``` ts
type TupleToObject<T extends readonly any[]> = {
  [key in T[number]]: key
}
```

## [获取元祖长度](https://github.com/type-challenges/type-challenges/blob/master/questions/18-easy-tuple-length/README.zh-CN.md)
``` ts
type Length<T> = T extends readonly any[] ? T['length'] : never
```

## [MyAwaited](https://github.com/type-challenges/type-challenges/blob/master/questions/189-easy-awaited/README.zh-CN.md)
``` ts
// type MyAwaited<T> = T extends { then: (fn: (res: infer R) => any) => any } ? MyAwaited<R> : T
type MyAwaited<T> = T extends Promise<infer R> ? MyAwaited<R> : T
```