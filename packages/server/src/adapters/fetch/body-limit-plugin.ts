import type { Context } from '../../context'
import type { FetchHandlerOptions } from './handler'
import type { FetchHandlerPlugin } from './plugin'
import { ORPCError } from '@orpc/client'

export interface BodyLimitPluginOptions {
  /**
   * The maximum size of the body in bytes.
   */
  maxBodySize: number
}

/**
 * The Body Limit Plugin restricts the size of the request body for the Fetch Server.
 *
 * @see {@link https://orpc.unnoq.com/docs/plugins/body-limit Body Limit Plugin Docs}
 */
export class BodyLimitPlugin<T extends Context> implements FetchHandlerPlugin<T> {
  private readonly maxBodySize: number

  constructor(options: BodyLimitPluginOptions) {
    this.maxBodySize = options.maxBodySize
  }

  /**
   * 实现 FetchHandlerPlugin 接口的 initRuntimeAdapter 方法。
   * 这个方法会在 FetchHandler 初始化时被调用，用于将插件的逻辑（即请求体大小限制）
   * 通过注入拦截器的方式集成到 FetchHandler 的处理流程中。
   *
   * @param options - FetchHandler 的配置选项，插件将向其添加拦截器。
   */
  initRuntimeAdapter(options: FetchHandlerOptions<T>): void {
    // 确保 options.adapterInterceptors 是一个数组，如果它不存在则初始化为空数组。
    // 这是为了方便地向其中 push 新的拦截器。
    options.adapterInterceptors ??= []

    // 向 FetchHandler 的适配器拦截器列表中添加一个新的拦截器函数。
    // 这个拦截器会在 FetchHandler 处理请求的核心逻辑之前执行。
    options.adapterInterceptors.push(async (options) => {
      // 检查请求对象 (options.request) 是否包含请求体 (body)。
      // 如果没有请求体 (例如 GET 请求)，则无需进行大小限制，直接调用 next() 交给下一个处理环节。
      if (!options.request.body) {
        return options.next()
      }

      // 初始化一个变量来跟踪当前已读取的请求体大小。
      let currentBodySize = 0

      // 获取原始请求体的 ReadableStreamDefaultReader。
      // 这是用来读取流式数据的底层接口。
      const rawReader = options.request.body.getReader()

      // 创建一个新的 ReadableStream (reader)。
      // 这个新的流将包装原始的读取器 (rawReader)，并在读取数据的过程中加入大小检查逻辑。
      const reader = new ReadableStream({
        // start 方法会在流开始被读取时调用。
        start: async (controller) => {
          try {
            // 优化：首先检查 Content-Length 请求头。
            // 如果请求头明确标明内容长度超过了限制，则直接报错，避免读取整个流。
            // 注意：Content-Length 可能不存在或不准确，所以后续仍然需要实际读取并计算大小。
            if (Number(options.request.headers.get('content-length')) > this.maxBodySize) {
              // 使用 controller.error() 来使新的流进入错误状态。
              controller.error(new ORPCError('PAYLOAD_TOO_LARGE'))
              return // 终止读取
            }

            // 循环读取原始请求体的数据块。
            while (true) {
              // 从原始读取器读取一块数据。
              // value 是一个 Uint8Array。
              // done 表示是否已读完所有数据。
              const { done, value } = await rawReader.read()

              // 如果数据已读完，跳出循环。
              if (done) {
                break
              }

              // 累加当前读取到的数据块的大小。
              currentBodySize += value.length

              // 检查累加的大小是否超过了设定的最大限制。
              if (currentBodySize > this.maxBodySize) {
                // 如果超限，使用 controller.error() 报错。
                controller.error(new ORPCError('PAYLOAD_TOO_LARGE'))
                break // 终止读取
              }

              // 如果未超限，将当前读取到的数据块放入新的流 (reader) 中。
              // 这样，下游的消费者就能从 reader 中读取到这块数据。
              controller.enqueue(value)
            }
          }
          finally {
            // 无论成功还是失败，最后都要关闭新的流。
            controller.close()
          }
        },
      })

      // 准备创建一个新的 Request 对象。
      // 我们需要保留原始请求的大部分信息，但要替换掉它的 body。
      // duplex: 'half' 是 Fetch API 的一个选项，允许我们在创建 Request 时提供一个 ReadableStream 作为 body。
      const requestInit: RequestInit & { duplex: 'half' } = { body: reader, duplex: 'half' }

      // 调用 options.next() 将控制权交给下一个拦截器或最终的请求处理器。
      // 关键在于，我们传递下去的是一个新的 options 对象：
      // - 它包含了原始 options 的所有属性 (...options)。
      // - 但 request 属性被替换成了一个新的 Request 实例。
      //   这个新的 Request 实例是使用原始请求 (options.request) 和我们刚刚准备的 requestInit 创建的，
      //   这意味着它的请求体是那个带有大小检查逻辑的新流 (reader)。
      return options.next({
        ...options,
        request: new Request(options.request, requestInit),
      })
    })
  }
}
