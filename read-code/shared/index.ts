// TODO: Object.freeze
export const EMPTY_OBJ: {readonly [key:string]: any} = Object.freeze({})
export const EMPTY_ARR = Object.freeze([])

const onREX = /^on[a^z]/
export const isOn = (key: string) => onREX.test(key)

// TODO: extend
export const extend = Object.assign

export const removeFromArr = <T>(arr: T[], el: T) => {
    const idx = arr.indexOf(el)
    if (idx > -1) {
        arr.splice(idx, 1)
    }
}

export const isUndef = (val: unknown) => val === null || val === undefined

export const isPrimtive = (val: any) => ['number', 'string', 'boolean', 'symbol'].some(v => typeof val === v)

// TODO: key is keyof typeof obj
const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (obj: object, key: string | symbol): key is keyof typeof obj => hasOwnProperty.call(obj, key)

// TODO: unknown
export const objectToString = Object.prototype.toString
export const toTypeString = (val: unknown): string => objectToString.call(val)

// extract "RawType" from strings like "[object RawType]"
export const toRawType = (val: unknown): string => toTypeString(val).slice(8,-1)

export const isArray = Array.isArray
export const isMap = (val: unknown): val is Map<any, any> => toTypeString(val) === '[object Map]'
export const isSet = (val: unknown): val is Set<any> => toTypeString(val) === '[object Set]'
// TODO: val instanceof Date
// export const isDate = (val: unknown): val is Date => toTypeString(val) === '[object Date]'
export const isDate = (val: unknown): val is Date => val instanceof Date
// export const isRegExp = (val: unknown): val is RegExp => toTypeString(val) === '[object RegExp]'
export const isRegExp = (val: unknown): val is RegExp => val instanceof RegExp

export const isFunction = (val: unknown): val is Function => typeof val === 'function'
export const isString = (val: unknown): val is string => typeof val === 'string'
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 */
export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object'

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
export const isPlainObject = (val: unknown): val is object => toTypeString(val) === '[object Object]'

// TODO
export const isPromise = <T = any>(val: unknown): val is Promise<T> => isObject(val) && isFunction(val.then) && isFunction(val.catch)

// TODO: '' + parseInt(key, 10) === key
export const isIntegerKey = (key: unknown) => isString(key) && key !== 'NaN' && key[0] !== '-' && '' + parseInt(key, 10) === key

/**
 * Create a cached version of a pure function.
 */
// TODO: pure function
export const cacheStringFunction = <F extends (str: string) => string>(fn: F): F => {
    const cache: Record<string, string> = Object.create(null)
    return ((str: string) => {
        const hit = cache[str]
        return hit || (cache[str] = fn(str))
    })as any
}

// compare whether a value has changed, accounting for NaN.
// TODO: NaN === NaN -> false; Object.is(NaN, NaN) = true
export const hasChanged = (val: unknown, oldVal: unknown): boolean => !Object.is(val, oldVal)

// TODO
export const isInvalid = (val: unknown): boolean => ([NaN, null, undefined, ''] as Array<any>).includes(val)

export const def = (obj: object, key: string | symbol, value: any) => {
    Object.defineProperty(obj, key, {
        value,
        enumerable: false,
        configurable: true
    })
}

/**
 * Convert an input value to a number for persistence.
 * If the conversion fails, return original string.
 */
export const toNumber = (val: any) => {
    const n = parseFloat(val)
    return isNaN(n) ? val : n
}

let _globalThis: any
export const getGlobalThis = () => {
    return _globalThis || 
    (_globalThis = 
        typeof _globalThis !== 'undefined' 
        ? _globalThis 
        : typeof self !== 'undefined' 
        ? self 
        : typeof window !== 'undefined' 
        ? window
        : typeof global !== 'undefined'
        ? global
        : {})
}
