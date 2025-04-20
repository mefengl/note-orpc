import type { Interceptor, MaybeOptionalOptions, ThrowableError } from '@orpc/shared'
import type { NodeHttpRequest, NodeHttpResponse, SendStandardResponseOptions } from '@orpc/standard-server-node'
import type { Context } from '../../context'
import type { StandardHandleOptions, StandardHandler } from '../standard'
import type { FriendlyStandardHandleOptions } from '../standard/utils'
import type { NodeHttpHandlerPlugin } from './plugin'
import { intercept, resolveMaybeOptionalOptions, toArray } from '@orpc/shared'
import { sendStandardResponse, toStandardLazyRequest } from '@orpc/standard-server-node'
import { resolveFriendlyStandardHandleOptions } from '../standard/utils'
import { CompositeNodeHttpHandlerPlugin } from './plugin'

/**
 * NodeHttpHandler 处理结果类型。
 * - `matched: true`: 表示请求已被成功处理。
 * - `matched: false`: 表示请求与此处理器不匹配 (例如，URL 前缀不匹配)，应由其他处理程序处理。
 */
export type NodeHttpHandleResult = { matched: true } | { matched: false }

/**
 * NodeHttpHandler 适配器拦截器的选项接口。
 * 继承了标准的处理选项 `StandardHandleOptions`。
 * 包含了 Node.js 特有的请求和响应对象，以及发送标准响应的选项。
 */
export interface NodeHttpHandlerInterceptorOptions<T extends Context> extends StandardHandleOptions<T> {
  /** Node.js 的原生 HTTP 请求对象 */
  request: NodeHttpRequest
  /** Node.js 的原生 HTTP 响应对象 */
  response: NodeHttpResponse
  /** 发送标准响应时的配置选项 */
  sendStandardResponseOptions: SendStandardResponseOptions
}

/**
 * NodeHttpHandler 的配置选项接口。
 * 继承了发送标准响应的选项 `SendStandardResponseOptions`。
 */
export interface NodeHttpHandlerOptions<T extends Context> extends SendStandardResponseOptions {
  /**
   * 适配器级别的拦截器。
   * 这些拦截器在核心的 `StandardHandler` 处理前后执行，允许在 Node.js HTTP 适配器层面进行干预。
   * 例如，可以用于身份验证、日志记录、修改请求/响应等。
   * 拦截器接收 `NodeHttpHandlerInterceptorOptions`，并返回 `NodeHttpHandleResult`。
   */
  adapterInterceptors?: Interceptor<NodeHttpHandlerInterceptorOptions<T>, NodeHttpHandleResult, ThrowableError>[]

  /**
   * Node.js HTTP 处理器插件列表。
   * 插件可以扩展处理器的功能，例如添加特定的头信息、处理 CORS 等。
   */
  plugins?: NodeHttpHandlerPlugin<T>[]
}

/**
 * Node.js HTTP 处理器。
 * 这是将 oRPC 与 Node.js HTTP 服务器（如原生 http、Express、Fastify 等）集成的核心类。
 * 它接收 Node.js 的请求和响应对象，将其转换为 oRPC 标准格式，
 * 然后委托给内部的 `StandardHandler` 进行核心 RPC 处理，
 * 最后将处理结果（标准响应）写回到 Node.js 的响应对象中。
 */
export class NodeHttpHandler<T extends Context> implements NodeHttpHandler<T> {
  /** 用于发送标准响应的配置选项 */
  private readonly sendStandardResponseOptions: SendStandardResponseOptions
  /** 适配器级别的拦截器列表 */
  private readonly adapterInterceptors: Exclude<NodeHttpHandlerOptions<T>['adapterInterceptors'], undefined>

  /**
   * 构造函数。
   * @param standardHandler - 核心的标准处理器实例，负责实际的 RPC 调用逻辑。
   * @param options - NodeHttpHandler 的配置选项。
   */
  constructor(
    private readonly standardHandler: StandardHandler<T>,
      options: NoInfer<NodeHttpHandlerOptions<T>> = {},
  ) {
    // 初始化并组合所有传入的插件
    const plugin = new CompositeNodeHttpHandlerPlugin(options.plugins)

    // 调用插件的初始化方法，允许插件修改或增强配置选项
    plugin.initRuntimeAdapter(options)

    // 确保拦截器是一个数组，并存储配置
    this.adapterInterceptors = toArray(options.adapterInterceptors)
    // 存储发送标准响应的选项 (可能已被插件修改)
    this.sendStandardResponseOptions = options
  }

  /**
   * 处理 Node.js 的 HTTP 请求。
   * 这是 Node.js 服务器（如 Express 中间件或原生 http 服务器的请求监听器）应该调用的主要方法。
   *
   * @param request - Node.js 的原生 HTTP 请求对象 (http.IncomingMessage)。
   * @param response - Node.js 的原生 HTTP 响应对象 (http.ServerResponse)。
   * @param rest - 可选的标准处理选项 (FriendlyStandardHandleOptions)，例如 `prefix`。
   *             可以使用 `resolveMaybeOptionalOptions` 来处理这些选项。
   * @returns 返回一个 Promise，解析为 `NodeHttpHandleResult`，指示请求是否被处理。
   */
  async handle(
    request: NodeHttpRequest,
    response: NodeHttpResponse,
    ...rest: MaybeOptionalOptions<FriendlyStandardHandleOptions<T>>
  ): Promise<NodeHttpHandleResult> {
    // 使用 `intercept` 函数包裹核心处理逻辑，执行适配器级别的拦截器
    return intercept(
      this.adapterInterceptors, // 要执行的拦截器列表
      {
        // 合并并解析标准处理选项 (如 prefix)
        ...resolveFriendlyStandardHandleOptions(resolveMaybeOptionalOptions(rest)),
        // 传入 Node.js 请求和响应对象
        request,
        response,
        // 传入发送标准响应的选项
        sendStandardResponseOptions: this.sendStandardResponseOptions,
      },
      // 核心处理函数，在所有前置拦截器成功执行后调用
      async ({ request, response, sendStandardResponseOptions, ...options }) => {
        // 将 Node.js 请求对象懒转换为 oRPC 标准请求对象
        // 'Lazy' 意味着请求体等可能需要异步读取的内容，只有在实际需要时才会被读取
        const standardRequest = toStandardLazyRequest(request, response)

        // 调用核心的 StandardHandler 来处理标准请求
        const result = await this.standardHandler.handle(standardRequest, options)

        // 如果 StandardHandler 返回不匹配 (例如，请求方法、路径或 Content-Type 不符合 RPC 规范)
        // 则此适配器也返回不匹配，允许其他中间件或路由处理该请求
        if (!result.matched) {
          return { matched: false }
        }

        // 如果 StandardHandler 成功处理了请求并返回了标准响应
        // 则使用 `sendStandardResponse` 工具函数将标准响应写回到 Node.js 的响应对象中
        await sendStandardResponse(response, result.response, sendStandardResponseOptions)

        // 返回匹配成功
        return { matched: true }
      },
    )
  }
}
