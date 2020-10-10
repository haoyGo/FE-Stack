# JS Interview Coding #

---

## instanceof ##

``` javascript
function inst(obj, constr) {
    const getProto = Object.getPrototypeOf
    const prototype = constr.prototype
    let proto = getProto(obj)

    while(true) {
        if (proto == null)
            return false
        if (proto === prototype)
            return true

        proto = getProto(proto)
    }
}
```

---

## new ##

``` javascript
function iNew() {
    const [fn, ...rest] = arguments
    const that = Object.create(fn.prototype)

    const res = fn.apply(that, rest)

    return (['object', 'function'].includes(typeof res) && res) || that
}
```

---

## call ##

``` javascript
function iCall(context = window, ...rest) {
    if (typeof this !== 'function')
        throw new TypeError('argument is not a function')

    const fn = Symbol('fn')
    context[fn] = this
    const res = context[fn](...rest)
    delete context[fn]

    return res
}
```

## apply ##

``` javascript
function iApply(context = window, rest) {
    if (typeof this !== 'function')
        throw new TypeError('argument is not a function')

    const fn = Symbol('fn')
    context[fn] = this
    const res = Array.isArray(rest) ? context[fn](...rest) : context[fn]()
    delete context[fn]

    return res
}
```

## bind ##

``` javascript
function iBind(context = window, ...rest1) {
    if (typeof this !== 'function')
        throw new TypeError('argument is not a function')

    const fn = this
    return function(...rest2) {
        return fn.apply(context, rest1.concat(rest2))
    }
}
```

---
