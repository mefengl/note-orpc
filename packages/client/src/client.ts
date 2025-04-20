import type { Client, ClientLink, FriendlyClientOptions, InferClientContext, NestedClient } from './types'
import { resolveFriendlyClientOptions } from './utils'

/**
 * 创建 oRPC 客户端时的可选配置项。
 */
export interface createORPCClientOptions {
  /**
   * 指定一个基础路径 (path prefix)。
   * 所有的 procedure 调用都会基于这个路径。
   * 这在你只想调用某个子路由下的 procedure 时很有用。
   * 例如，如果服务器端路由是 { users: { get: ..., list: ... }, posts: { ... } }
   * 设置 path: ['users'] 后，创建的 client 就只能调用 client.get(...) 和 client.list(...)
   * 对应的实际路径会是 ['users', 'get'] 和 ['users', 'list']。
   */
  path?: string[]
}

/**
 * 从一个 ClientLink 创建 oRPC 客户端实例。
 * 这个函数是 oRPC 客户端的核心，它返回一个神奇的“代理”对象，
 * 让你可以像调用本地函数一样调用远程服务器上的 API，并且拥有完整的类型提示。
 *
 * @template T - 服务器端定义的 API 结构类型。这通常是从 `@orpc/server` 导出的 `router.infer` 类型。
 *               它告诉客户端有哪些 procedure 可以调用，以及它们的输入输出类型是什么。
 *               例如：`typeof import('./server').router.infer`
 * @param link - 客户端链接 (ClientLink)。这是实际负责发送请求和接收响应的模块。
 *               你可以把它想象成客户端和服务器之间的“电话线”。不同的 link 实现不同的通信方式，
 *               比如基于 Fetch API 的 HTTP 请求 (`fetchLink`)，或者基于 Server-Sent Events (`sseLink`)。
 * @param options - 可选的配置项。
 * @returns 返回一个类型化、可调用的客户端代理对象。
 *          你可以通过这个对象调用服务器端的 procedure，就像调用嵌套的对象方法一样。
 *          例如：`client.users.getById(1)`
 *
 * @see {@link https://orpc.unnoq.com/docs/client/client-side Client-side Client 文档}
 */
export function createORPCClient<T extends NestedClient<any>>(
  link: ClientLink<InferClientContext<T>>, // 接收一个 ClientLink 实例
  options?: createORPCClientOptions, // 接收可选的配置
): T /* 返回与服务器 API 结构 T 匹配的客户端类型 */ {
  // 获取基础路径，默认为空数组 []
  const path = options?.path ?? []

  /**
   * 这是实际执行远程过程调用的函数。
   * 当你在客户端代理对象上调用一个具体的方法时 (例如 `client.users.getById(1)`),
   * 最终会执行到这个函数。
   * 它接收输入数据 (input) 和调用选项 (options)，然后通过 link 发起请求。
   */
  const procedureClient: Client<InferClientContext<T>, unknown, unknown, Error> = async (
    // input 是调用 procedure 时传入的参数
    // options 是调用时传入的额外选项，比如 context
    ...[input, options = {} as FriendlyClientOptions<InferClientContext<T>>]
  ) => {
    // 调用 link 的 call 方法，传入完整的路径、输入数据和处理过的选项
    // link.call 会负责与服务器通信并返回结果
    return await link.call(path, input, resolveFriendlyClientOptions(options))
  }

  /**
   * 这里是魔法发生的地方：使用了 JavaScript 的 Proxy。
   * Proxy 允许我们创建一个“代理”对象，拦截对这个对象属性的访问。
   *
   * 当你访问客户端对象的属性时 (例如 `client.users`)，`get` 拦截器会被触发。
   * - `target` 是被代理的对象 (这里是 procedureClient 函数，虽然我们主要用它作为代理的基础)。
   * - `key` 是你访问的属性名 (例如 'users')。
   *
   * 在 `get` 拦截器中：
   * 1. 检查 key 是否为字符串。如果不是 (比如访问 `Symbol.toStringTag`)，则直接返回原始对象的属性。
   * 2. 如果 key 是字符串，说明你正在访问 API 路径的一部分 (如 'users')。
   * 3. 我们递归地调用 `createORPCClient`，并把当前的 key 添加到 path 数组中 (例如 `['users']`)。
   *    这样就创建了一个新的、路径更深的代理对象，代表 API 结构中的下一层。
   *    当你继续访问 `client.users.getById` 时，会再次触发 Proxy 的 get 拦截器，
   *    这次 key 是 'getById'，path 变为 `['users', 'getById']`。
   *
   * 当你最终调用一个方法时 (例如 `client.users.getById(1)`)：
   * 因为 Proxy 的目标 `target` 是 `procedureClient` 函数，所以最终调用会落到 `procedureClient` 上。
   * 此时，`procedureClient` 内部的 `path` 变量已经通过递归调用累积成了完整的路径 `['users', 'getById']`。
   * 然后 `procedureClient` 就会使用这个完整的路径和参数 `1` 去调用 `link.call`。
   */
  const recursive = new Proxy(procedureClient, {
    get(target, key) {
      // 如果访问的属性不是字符串 (比如 Symbol)，直接返回
      if (typeof key !== 'string') {
        return Reflect.get(target, key)
      }

      // 递归创建下一层客户端代理，并将当前 key 加入路径
      return createORPCClient(link, {
        ...options, // 保留之前的选项
        path: [...path, key], // 将当前访问的 key 添加到路径末尾
      })
    },
  })

  // 将创建的 Proxy 对象强制转换为服务器 API 结构 T 的类型
  // 因为 Proxy 的动态特性，TypeScript 无法直接推断出它符合 T 的结构，
  // 但我们通过 Proxy 的实现保证了它在运行时会模拟出 T 的结构和行为。
  return recursive as any
}
