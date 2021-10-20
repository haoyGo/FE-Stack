/**
 * Evaluates JavaScript code and executes it.
 * @param val A String value that contains valid JavaScript code.
 */
export const _eval = (val: string): any => eval(val)

/**
 * Converts a string to an integer.
 * @param s A string to convert into a number.
 * @param radix A value between 2 and 36 that specifies the base of the number in numString.
 * If this argument is not supplied, strings with a prefix of '0x' are considered hexadecimal.
 * All other strings are considered decimal.
 */
export const _parseInt = (s: string, radix?: number): number => parseInt(s, radix)

/**
 * Converts a string to a floating-point number.
 * @param s A string that contains a floating-point number.
 */
export const _parseFloat = (s: string): number => parseFloat(s)

/**
 * Returns a Boolean value that indicates whether a value is the reserved value NaN (not a number).
 * @param number A numeric value.
 */
export const _isNaN = (number: number): boolean => isNaN(number)

/**
 * Determines whether a supplied number is finite.
 * @param number Any numeric value.
 */
export const _isFinite = (number: number): boolean => isFinite(number)

/**
 * Encodes a text string as a valid Uniform Resource Identifier (URI)
 * @param uri A value representing an encoded URI.
 */
export const _encodeURI = (uri: string): string => encodeURI(uri)

/**
 * Gets the unencoded version of an encoded Uniform Resource Identifier (URI).
 * @param encodedURI A value representing an encoded URI.
 */
export const _decodeURI = (encodedURI: string): string => decodeURI(encodedURI)

/**
 * Encodes a text string as a valid component of a Uniform Resource Identifier (URI).
 * @param uriComponent A value representing an encoded URI component.
 */
export const _encodeURIComponent = (uriComponent: string | number | boolean): string => encodeURIComponent(uriComponent)

/**
 * Gets the unencoded version of an encoded component of a Uniform Resource Identifier (URI).
 * @param encodedURIComponent A value representing an encoded URI component.
 */
export const _decodeURIComponent = (encodedURIComponent: string): string => decodeURIComponent(encodedURIComponent)

/*
 * Note that encodeURI() by itself cannot form proper HTTP GET and POST requests, 
 * such as for XMLHttpRequest, because "&", "+", and "=" are not encoded, 
 * which are treated as special characters in GET and POST requests. 
 * encodeURIComponent(), however, does encode these characters.
 */

export interface Symbol {
    /** Returns a string representation of an object. */
    toString(): string;

    /** Returns the primitive value of the specified object. */
    valueOf(): symbol;
}

export type PropertyKey = string | number | symbol

export interface PropertyDescriptor {
    configurable?: boolean
    enumerable?: boolean
    writable?: boolean
    value?: any
    get?(): any
    set?(val: any): void
}