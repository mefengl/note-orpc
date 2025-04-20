/**
 * @file packages/contract/src/index.ts
 * @description 这是 `@orpc/contract` 包的主要入口文件（也称为 Barrel File）。
 * 它的主要作用是整合并重新导出 (re-export) 包内定义的各种核心组件和类型，
 * 以及从其他 `@orpc` 包导入的相关类型，为使用者提供一个统一、简洁的导入接口。
 *
 * 通过这个入口文件，其他包或应用可以直接从 '@orpc/contract' 导入所需内容，
 * 无需关心包内部的具体文件组织结构。
 *
 * 主要重新导出的模块和类型包括：
 * - 构建器 (Builders): 用于创建 Procedure 和 Router 的工具，位于 `./builder` 和 `./builder-variants`。
 * - 配置 (Config): 可能包含与 Contract 相关的配置选项，位于 `./config`。
 * - 错误处理 (Error): 定义或导出与 Contract 相关的错误类型，位于 `./error`。
 * - 事件迭代器 (Event Iterator): 可能用于处理流式事件，位于 `./event-iterator`。
 * - 元数据 (Meta): 可能包含 Procedure 或 Router 的元信息，位于 `./meta`。
 * - Procedure: 定义单个 API 端点的结构和行为，位于 `./procedure` 和 `./procedure-client`。
 * - 路由 (Route & Router): 定义一组 Procedure 的集合和路由逻辑，位于 `./route`, `./router`, `./router-client`, 和 `./router-utils`。
 * - 模式/验证 (Schema): 可能包含用于数据验证的 Schema 定义或工具，位于 `./schema`。
 * - 从 `@orpc/client` 重新导出的类型: `ORPCError`, `HTTPMethod`, `HTTPPath`。
 * - 从 `@orpc/shared` 重新导出的类型: `Registry`, `ThrowableError`。
 */

/** unnoq */

export * from './builder'
export * from './builder-variants'
export * from './config'
export * from './error'
export * from './event-iterator'
export * from './meta'
export * from './procedure'
export * from './procedure-client'
export * from './route'
export * from './router'
export * from './router-client'
export * from './router-utils'
export * from './schema'

// 从其他 @orpc 包重新导出特定类型，方便 contract 包的使用者
export { ORPCError } from '@orpc/client' // 导出客户端定义的标准 ORPC 错误类型
export type { HTTPMethod, HTTPPath } from '@orpc/client' // 导出 HTTP 方法和路径类型
export type { Registry, ThrowableError } from '@orpc/shared' // 导出共享的 Registry 和 ThrowableError 类型定义
