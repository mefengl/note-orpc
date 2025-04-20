/**
 * @file packages/server/src/index.ts
 * @description 这是 `@orpc/server` 包的主要入口文件（Barrel File）。
 * 它的核心职责是整合和重新导出 (re-export) 包内所有与服务器端逻辑实现相关的组件、
 * 工具函数和类型，并补充导入其他 `@orpc` 包的必要部分，对外提供统一的编程接口。
 *
 * 使用者可以通过直接从 `@orpc/server` 导入所需功能，而无需了解其内部复杂的模块结构。
 *
 * 主要重新导出的模块和类型包括：
 * - 构建器 (Builder): 用于构建服务器端 Router 和 Procedure 的工具，位于 `./builder` 和 `./builder-variants`。
 * - 配置 (Config): 服务器相关的配置，位于 `./config`。
 * - 上下文 (Context): 定义请求处理过程中的上下文对象，位于 `./context`。
 * - 错误处理 (Error): 服务器端的错误定义和处理，位于 `./error`。
 * - 实现器 (Implementer): 处理 Procedure 具体逻辑的核心部分，位于 `./implementer`, `./implementer-procedure`, `./implementer-variants`。
 * - 懒加载 (Lazy): 可能与延迟加载相关的工具，位于 `./lazy`。
 * - 中间件 (Middleware): 用于在请求处理流程中插入逻辑，位于 `./middleware`, `./middleware-decorated`, `./middleware-utils`。
 * - Procedure: 服务器端 Procedure 的定义、行为和相关工具，位于 `./procedure`, `./procedure-action`, `./procedure-client`, `./procedure-decorated`, `./procedure-utils`。
 * - Router: 服务器端路由的定义、组合和相关工具，位于 `./router`, `./router-client`, `./router-hidden`, `./router-utils`。
 * - 从 `@orpc/client` 重新导出的函数和类型: `isDefinedError`, `ORPCError`, `safe`, `ClientContext`, `HTTPMethod`, `HTTPPath`。
 * - 从 `@orpc/contract` 重新导出的函数和类型: `eventIterator`, `type`, `ValidationError`, 以及多种 Contract 相关的类型如 `ContractProcedure`, `ContractRouter`, `Schema` 等。
 * - 从 `@orpc/shared` 重新导出的函数和类型: `onError`, `onFinish`, `onStart`, `onSuccess`, `IntersectPick`, `Registry`, `ThrowableError`。
 * - 从 `@orpc/standard-server` 重新导出的函数: `getEventMeta`, `withEventMeta`。
 */

export * from './builder'
export * from './builder-variants'
export * from './config'
export * from './context'
export * from './error'
export * from './implementer'
export * from './implementer-procedure'
export * from './implementer-variants'
export * from './lazy'
export * from './middleware'
export * from './middleware-decorated'
export * from './middleware-utils'
export * from './procedure'
export * from './procedure-action'
export * from './procedure-client'
export * from './procedure-decorated'
export * from './procedure-utils'
export * from './router'
export * from './router-client'
export * from './router-hidden'
export * from './router-utils'

// --- 从其他 @orpc 包重新导出 --- //

// 从 @orpc/client 导出
export { isDefinedError, ORPCError, safe } from '@orpc/client'
export type { ClientContext, HTTPMethod, HTTPPath } from '@orpc/client'

// 从 @orpc/contract 导出
export { eventIterator, type, ValidationError } from '@orpc/contract'
export type {
  ContractProcedure,
  ContractProcedureDef,
  ContractRouter,
  ErrorMap,
  ErrorMapItem,
  InferSchemaInput,
  InferSchemaOutput,
  InputStructure,
  MergedErrorMap,
  Meta,
  OutputStructure,
  Route,
  Schema,
} from '@orpc/contract'

// 从 @orpc/shared 导出
export type { IntersectPick } from '@orpc/shared'
export { onError, onFinish, onStart, onSuccess } from '@orpc/shared'
export type { Registry, ThrowableError } from '@orpc/shared'

// 从 @orpc/standard-server 导出 (通常是适配器相关的基础功能)
export { getEventMeta, withEventMeta } from '@orpc/standard-server'
