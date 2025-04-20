import type { Context } from '../../context'
import type { NodeHttpHandlerOptions } from './handler'
import type { NodeHttpHandlerPlugin } from './plugin'
import { ORPCError } from '@orpc/client'

export interface BodyLimitPluginOptions {
  /**
   * The maximum size of the body in bytes.
   */
  maxBodySize: number
}

/**
 * The Body Limit Plugin restricts the size of the request body for the Node.js HTTP Server.
 *
 * @see {@link https://orpc.unnoq.com/docs/plugins/body-limit Body Limit Plugin Docs}
 */
export class BodyLimitPlugin<T extends Context> implements NodeHttpHandlerPlugin<T> {
  private readonly maxBodySize: number

  constructor(options: BodyLimitPluginOptions) {
    this.maxBodySize = options.maxBodySize
  }

  initRuntimeAdapter(options: NodeHttpHandlerOptions<T>): void {
    // 确保 options.adapterInterceptors 数组存在，如果不存在则初始化为空数组
    options.adapterInterceptors ??= []

    // 添加一个新的适配器拦截器到数组中
    options.adapterInterceptors.push(async (options) => {
      // 用于标记是否已经检查过 Content-Length 请求头
      let isHeaderChecked = false

      // 检查 Content-Length 请求头的函数
      const checkHeader = () => {
        // 仅在首次检查时执行
        if (!isHeaderChecked && Number(options.request.headers['content-length']) > this.maxBodySize) {
          // 如果 Content-Length 头明确表示请求体大小超过限制，则立即抛出错误
          // 这是一种优化，避免不必要地处理数据流
          throw new ORPCError('PAYLOAD_TOO_LARGE')
        }

        // 标记已检查过头部
        isHeaderChecked = true
      }

      // 保存原始的 request.emit 方法引用，以便稍后调用
      const originalEmit = options.request.emit.bind(options.request)

      // 用于累加已接收到的请求体数据大小
      let currentBodySize = 0

      // === 核心逻辑：猴子补丁 request.emit 方法 ===
      // 通过替换原始的 emit 方法，我们可以拦截 Node.js 在接收到数据块时触发的 'data' 事件
      options.request.emit = (event: string, ...args: any[]) => {
        // 只关心 'data' 事件
        if (event === 'data') {
          // 在处理第一个数据块之前，先检查 Content-Length 头 (如果还没检查过)
          checkHeader()

          // 'data' 事件的第一个参数 (args[0]) 通常是 Buffer 类型的数据块
          // 累加当前数据块的长度到 currentBodySize
          currentBodySize += args[0].length

          // 检查累计大小是否已超过限制
          if (currentBodySize > this.maxBodySize) {
            // 如果超过限制，抛出错误，停止后续处理
            // 注意：这里抛出的错误会被 oRPC 框架捕获并转换为标准的 RPC 错误响应
            throw new ORPCError('PAYLOAD_TOO_LARGE')
          }
        }

        // 调用原始的 emit 方法，确保其他事件监听器能正常工作
        // 并且将 'data' 事件和数据块传递下去，供后续的请求处理逻辑（如 JSON 解析）使用
        return originalEmit(event, ...args)
      }

      // 调用下一个拦截器或最终的请求处理器
      return options.next()
    })
  }
}
