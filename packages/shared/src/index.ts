/**
 * @module @orpc/shared/index
 * @description
 * This is the main entry point (barrel file) for the `@orpc/shared` package.
 * It re-exports various utility functions, types, and classes used across the oRPC ecosystem.
 * The goal of this package is to provide common, reusable logic to other oRPC packages,
 * reducing code duplication and ensuring consistency.
 *
 * 主要导出内容包括:
 * - Argument handling utilities (`./args`)
 * - Array manipulation helpers (`./array`)
 * - Function chaining/composition tools (`./chain`)
 * - General function utilities (`./function`)
 * - Interceptor pattern implementation (`./interceptor`)
 * - Iterator helpers (`./iterator`)
 * - JSON handling utilities, including support for special types (`./json`)
 * - Object manipulation helpers (`./object`)
 * - Common TypeScript types and type guards (`./types`)
 * - Value checking and manipulation (`./value`)
 *
 * Additionally, it re-exports selected useful functions and types from external libraries:
 * - `radash`: A functional utility library.
 * - `type-fest`: A collection of essential TypeScript types.
 */

export * from './args'
export * from './array'
export * from './chain'
export * from './function'
export * from './interceptor'
export * from './iterator'
export * from './json'
export * from './object'
export * from './types'
export * from './value'

export { group, guard, mapEntries, mapValues, omit } from 'radash'
export type { IsEqual, IsNever, PartialDeep, Promisable } from 'type-fest'
