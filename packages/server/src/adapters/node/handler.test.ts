import type { IncomingMessage, ServerResponse } from 'node:http'
import { sendStandardResponse, toStandardLazyRequest } from '@orpc/standard-server-node'
import request from 'supertest' // 用于模拟 HTTP 请求的库
import { NodeHttpHandler } from './handler' // 引入要测试的类

// === Mocking Dependencies ===
// 使用 vi.mock 来模拟外部依赖，以便隔离测试 NodeHttpHandler 本身的功能
vi.mock('@orpc/standard-server-node', () => ({
  // 模拟 toStandardLazyRequest 函数
  toStandardLazyRequest: vi.fn(),
  // 模拟 sendStandardResponse 函数
  sendStandardResponse: vi.fn(),
}))

// 模拟 ../standard 目录下的模块
vi.mock('../standard', async (origin) => ({
  // 保留原始模块的其他导出
  ...(await origin()),
  // 特别模拟 StandardHandler 类（通常是 NodeHttpHandler 依赖的底层处理器）
  StandardHandler: vi.fn(),
}))

// 在每个测试用例运行之前，清除所有模拟函数的调用记录
beforeEach(() => {
  vi.clearAllMocks()
})

// === Test Suite: NodeHttpHandler ===
describe('NodeHttpHandler 测试套件', async () => {
  // --- Test Setup ---
  // 创建一个模拟的底层 handle 函数，用于 StandardHandler
  const handle = vi.fn()
  // 创建一个模拟的适配器拦截器函数
  const interceptor = vi.fn(({ next }) => next()) // 拦截器简单地调用 next() 继续处理

  // 定义 NodeHttpHandler 的构造选项，包含拦截器
  const handlerOptions = { eventIteratorKeepAliveComment: '__test__', adapterInterceptors: [interceptor] }

  // 创建 NodeHttpHandler 实例，传入模拟的 handle 和选项
  // `as any` 用于绕过类型检查，因为我们传入的是模拟的 handle 而不是完整的 StandardHandler 实例
  const handler = new NodeHttpHandler({
    handle,
  } as any, handlerOptions)

  // 使用 supertest 创建模拟的 Node.js 请求 (req) 和响应 (res) 对象
  let req: any, res: any
  await request(async (_req: IncomingMessage, _res: ServerResponse) => {
    // 在 supertest 的请求处理回调中捕获 req 和 res 对象
    req = _req
    res = _res
    // 必须结束响应，否则 supertest 会挂起
    res.end()
  }).get('/api/v1') // 发起一个 GET 请求来触发回调并获取 req/res

  // 创建一个模拟的标准请求对象，这是 toStandardLazyRequest 应该返回的对象
  const standardRequest = {
    method: 'POST', // 假设这是一个 POST 请求
    url: new URL('https://example.com/api/v1/users/1'), // 模拟请求的 URL
    headers: { // 模拟请求头
      'content-type': 'application/json',
      'content-length': '12',
    },
    body: () => Promise.resolve(JSON.stringify({ name: 'John Doe' })), // 模拟请求体
    signal: undefined, // 模拟 AbortSignal
  }

  // --- Test Case: Successful Match ---
  it('匹配成功时应该正确处理请求', async () => {
    // 模拟设置：
    // - toStandardLazyRequest 返回上面定义的 standardRequest
    vi.mocked(toStandardLazyRequest).mockReturnValueOnce(standardRequest)
    // - 底层 handle 函数返回一个匹配成功的响应
    handle.mockReturnValueOnce({
      matched: true,
      response: {
        status: 200,
        headers: {},
        body: '__body__', // 模拟响应体
      },
    })
    // 定义调用 handler.handle 时传入的选项
    const options = { prefix: '/api/v1', context: { db: 'postgres' } } as const

    // 执行动作：调用 handler 的 handle 方法处理模拟的 req 和 res
    const result = await handler.handle(req, res, options)

    // 断言：
    // - 检查 handle 方法的返回值是否表示匹配成功
    expect(result).toEqual({
      matched: true,
    })

    // - 检查底层 handle 函数是否被调用了一次
    expect(handle).toHaveBeenCalledOnce()
    // - 检查底层 handle 函数被调用时传入的参数是否正确（标准请求和选项）
    expect(handle).toHaveBeenCalledWith(
      standardRequest, // 验证传入了转换后的标准请求
      { prefix: '/api/v1', context: { db: 'postgres' } }, // 验证传入了正确的选项
    )

    // - 检查 toStandardLazyRequest 是否被调用了一次
    expect(toStandardLazyRequest).toHaveBeenCalledOnce()
    // - 检查 toStandardLazyRequest 被调用时传入的参数是否正确（原始 req 和 res）
    expect(toStandardLazyRequest).toHaveBeenCalledWith(req, res)

    // - 检查 sendStandardResponse 是否被调用了一次（因为请求匹配了）
    expect(sendStandardResponse).toHaveBeenCalledOnce()
    // - 检查 sendStandardResponse 被调用时传入的参数是否正确（原始 res、标准响应、处理器选项）
    expect(sendStandardResponse).toHaveBeenCalledWith(res, {
      status: 200,
      headers: {},
      body: '__body__',
    }, handlerOptions)

    // - 检查拦截器函数是否被调用了一次
    expect(interceptor).toHaveBeenCalledOnce()
    // - 检查拦截器被调用时传入的参数是否正确
    expect(interceptor).toHaveBeenCalledWith({
      request: req,
      response: res,
      sendStandardResponseOptions: handlerOptions,
      ...options, // 包含 prefix 和 context
      next: expect.any(Function), // 检查 next 是否是一个函数
    })
    // - 检查拦截器的返回值 (通过调用 next() 得到的结果)
    expect(await interceptor.mock.results[0]!.value).toEqual({
      matched: true,
    })
  })

  // --- Test Case: Mismatch ---
  it('不匹配时应该返回不匹配的结果', async () => {
    // 模拟设置：
    // - toStandardLazyRequest 返回标准请求
    vi.mocked(toStandardLazyRequest).mockReturnValueOnce(standardRequest)
    // - 底层 handle 函数返回不匹配的结果
    handle.mockReturnValueOnce({
      matched: false,
      response: undefined,
    })

    // 定义调用 handler.handle 时传入的选项
    const options = { prefix: '/api/v1', context: { db: 'postgres' } } as const

    // 执行动作：调用 handler 的 handle 方法
    const result = await handler.handle(req, res, options)

    // 断言：
    // - 检查 handle 方法的返回值是否表示不匹配
    expect(result).toEqual({
      matched: false,
      response: undefined,
    })

    // - 检查底层 handle 函数是否被调用了一次
    expect(handle).toHaveBeenCalledOnce()
    // - 检查底层 handle 函数被调用时传入的参数是否正确
    expect(handle).toHaveBeenCalledWith(
      standardRequest,
      options,
    )

    // - 检查 toStandardLazyRequest 是否被调用了一次
    expect(toStandardLazyRequest).toHaveBeenCalledOnce()
    // - 检查 toStandardLazyRequest 被调用时传入的参数是否正确
    expect(toStandardLazyRequest).toHaveBeenCalledWith(req, res)

    // - 检查 sendStandardResponse 是否 *没有* 被调用（因为请求不匹配）
    expect(sendStandardResponse).not.toHaveBeenCalled()

    // - 检查拦截器函数是否被调用了一次（拦截器总会被调用）
    expect(interceptor).toHaveBeenCalledOnce()
    // - 检查拦截器被调用时传入的参数是否正确
    expect(interceptor).toHaveBeenCalledWith({
      request: req,
      response: res,
      sendStandardResponseOptions: handlerOptions,
      ...options,
      next: expect.any(Function),
    })
    // - 检查拦截器的返回值
    expect(await interceptor.mock.results[0]!.value).toEqual({
      matched: false,
    })
  })

  // --- Test Case: Plugin Initialization ---
  it('应该正确初始化插件', () => {
    // 模拟设置：创建一个带 initRuntimeAdapter 方法的模拟插件
    const initRuntimeAdapter = vi.fn()

    // 创建 NodeHttpHandler 实例，这次在选项中传入模拟插件
    const handler = new NodeHttpHandler({
      handle,
    } as any, {
      plugins: [
        { initRuntimeAdapter }, // 模拟插件
      ],
      eventIteratorKeepAliveComment: '__test__',
    })

    // 断言：
    // - 检查插件的 initRuntimeAdapter 方法是否在 handler 构造时被调用了一次
    expect(initRuntimeAdapter).toHaveBeenCalledOnce()
    // - 检查 initRuntimeAdapter 被调用时传入的参数是否是正确的选项对象
    expect(initRuntimeAdapter).toHaveBeenCalledWith({
      plugins: [
        { initRuntimeAdapter },
      ],
      eventIteratorKeepAliveComment: '__test__',
    })
  })
})
