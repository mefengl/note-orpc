/**
 * @fileoverview
 * 这个文件定义了 `FetchHandler` 类。
 * 它的核心作用是作为一个适配器 (Adapter)，将 oRPC 的标准处理逻辑 (`StandardHandler`)
 * 与 Web 标准的 Fetch API 进行桥接。
 * 它负责接收 Fetch `Request` 对象，将其转换为 oRPC 内部格式交给 `StandardHandler` 处理，
 * 然后再将 `StandardHandler` 返回的内部响应转换为标准的 Fetch `Response` 对象。
 * 这使得 oRPC 服务能够直接被使用 Fetch API 的客户端（如浏览器）调用。
 */

import type { Interceptor, MaybeOptionalOptions, ThrowableError } from '@orpc/shared'
import type { ToFetchResponseOptions } from '@orpc/standard-server-fetch'
import type { Context } from '../../context'
import type { StandardHandleOptions, StandardHandler } from '../standard'
import type { FriendlyStandardHandleOptions } from '../standard/utils'
import type { FetchHandlerPlugin } from './plugin'
import { intercept, resolveMaybeOptionalOptions, toArray } from '@orpc/shared'
import { toFetchResponse, toStandardLazyRequest } from '@orpc/standard-server-fetch'
import { resolveFriendlyStandardHandleOptions } from '../standard/utils'
import { CompositeFetchHandlerPlugin } from './plugin'

/**
 * 定义 `FetchHandler` 处理请求后可能返回的结果类型。
 * - 如果请求被成功匹配并处理，`matched` 为 `true`，并包含一个标准的 `Response` 对象。
 * - 如果请求没有被路由匹配或者其他原因未能处理，`matched` 为 `false`，`response` 为 `undefined`。
 */
export type FetchHandleResult = { matched: true, response: Response } | { matched: false, response: undefined }

/**
 * 定义 Fetch 适配器层拦截器的选项类型。
 * 这个接口继承了标准的处理选项 `StandardHandleOptions`，并额外添加了 Fetch 特定的属性：
 * - `request`: 原始的 Fetch `Request` 对象。
 * - `toFetchResponseOptions`: 将 oRPC 内部响应转换为 Fetch `Response` 时使用的选项。
 */
export interface FetchHandlerInterceptorOptions<T extends Context> extends StandardHandleOptions<T> {
  request: Request
  toFetchResponseOptions: ToFetchResponseOptions
}

/**
 * 定义 `FetchHandler` 的构造函数和处理方法所接受的选项。
 * - `adapterInterceptors`: 可选的拦截器数组。这些拦截器运行在 Fetch 适配器层，
 *   可以在 `standardHandler` 处理请求之前或之后执行逻辑，比如修改请求/响应，或者进行日志记录、鉴权等。
 * - `plugins`: 可选的插件数组。插件可以扩展 `FetchHandler` 的功能，比如添加特定的请求头处理、错误处理等。
 * 其他选项继承自 `ToFetchResponseOptions`，用于控制如何将内部响应转换为 Fetch `Response`。
 */
export interface FetchHandlerOptions<T extends Context> extends ToFetchResponseOptions {
  adapterInterceptors?: Interceptor<FetchHandlerInterceptorOptions<T>, FetchHandleResult, ThrowableError>[]

  plugins?: FetchHandlerPlugin<T>[]
}

/**
 * Fetch 适配器处理器。
 * 它的实例负责接收标准的 Fetch API `Request`，并将其路由到 oRPC 的 `StandardHandler` 进行处理，
 * 最后将结果转换回标准的 Fetch API `Response`。
 *
 * @template T - 上下文 (Context) 类型，用于在请求处理过程中传递数据。
 */
export class FetchHandler<T extends Context> {
  // 用于控制内部响应到 Fetch Response 转换的选项
  private readonly toFetchResponseOptions: ToFetchResponseOptions
  // Fetch 适配器层的拦截器数组
  private readonly adapterInterceptors: Exclude<FetchHandlerOptions<T>['adapterInterceptors'], undefined>

  /**
   * 创建一个新的 `FetchHandler` 实例。
   *
   * @param standardHandler - 核心的 oRPC 标准处理器实例，负责实际的 API 路由和调用逻辑。
   * @param options - 可选的配置选项，用于配置拦截器、插件和响应转换行为。
   */
  constructor(
    private readonly standardHandler: StandardHandler<T>,
    options: NoInfer<FetchHandlerOptions<T>> = {},
  ) {
    // 将传入的插件组合成一个复合插件
    const plugin = new CompositeFetchHandlerPlugin(options.plugins)

    // 初始化运行时适配器，允许插件修改或增强 `toFetchResponseOptions`
    plugin.initRuntimeAdapter(options)

    // 确报拦截器是一个数组，即使没有提供
    this.adapterInterceptors = toArray(options.adapterInterceptors)
    // 存储最终的响应转换选项
    this.toFetchResponseOptions = options
  }

  /**
   * 处理一个传入的 Fetch `Request` 对象。
   * 这是 `FetchHandler` 的核心方法。
   *
   * @param request - 符合 Fetch API 标准的 `Request` 对象。
   * @param rest - 可选的标准处理选项 (FriendlyStandardHandleOptions)，比如上下文对象。
   * @returns 一个 Promise，解析为 `FetchHandleResult` 对象，表明请求是否被匹配和处理，并包含相应的 `Response` (如果匹配)。
   */
  async handle(
    request: Request,
    ...rest: MaybeOptionalOptions<FriendlyStandardHandleOptions<T>>
  ): Promise<FetchHandleResult> {
    // 使用 `intercept` 函数来包裹核心处理逻辑，使得适配器拦截器可以介入
    return intercept(
      this.adapterInterceptors, // 应用适配器层拦截器
      {
        // 解析并合并处理选项
        ...resolveFriendlyStandardHandleOptions(resolveMaybeOptionalOptions(rest)),
        // 传入原始请求和响应转换选项，供拦截器使用
        request,
        toFetchResponseOptions: this.toFetchResponseOptions,
      },
      // 核心处理函数，在所有前置拦截器执行后运行
      async ({ request, toFetchResponseOptions, ...options }) => {
        // 将 Fetch Request 转换为 oRPC 内部的 StandardLazyRequest
        // 'Lazy' 表示可能不会立即读取请求体，提高性能
        const standardRequest = toStandardLazyRequest(request)

        // 调用核心的 StandardHandler 来处理转换后的请求
        const result = await this.standardHandler.handle(standardRequest, options)

        // 如果 StandardHandler 表示请求未被匹配 (例如，没有找到对应的路由)
        if (!result.matched) {
          // 直接返回未匹配的结果
          return result
        }

        // 如果请求被成功处理，将 StandardHandler 返回的内部响应 (StandardResponse)
        // 转换为标准的 Fetch API Response 对象
        return {
          matched: true,
          response: toFetchResponse(result.response, toFetchResponseOptions),
        }
      },
      // 这里可以添加错误处理拦截器，但当前实现依赖 intercept 函数的默认错误处理
    )
  }
}
